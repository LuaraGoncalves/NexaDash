<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Sale;
use App\Services\SaleWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SaleController extends Controller
{
    public function __construct(private readonly SaleWorkflowService $saleWorkflowService) {}

    public function index()
    {
        return Sale::query()
            ->with('customer')
            ->latest('id')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $this->validateSalePayload($request);

        $sale = $this->saleWorkflowService->create(
            $this->buildSaleAttributes($validated),
            $request->user()
        );

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'vendas',
            "Venda criada: {$sale->protocolo}",
            ['sale_id' => $sale->id, 'status' => $sale->status]
        );

        return $sale->fresh()->load('customer');
    }

    public function update(Request $request, string $id)
    {
        $sale = Sale::findOrFail($id);
        $statusAnterior = $sale->status;

        if (! $request->hasAny(['id_cliente', 'cliente_nome', 'data_hora', 'total', 'forma_pagamento', 'itens'])) {
            $validated = $request->validate([
                'status' => ['required', Rule::in(Sale::STATUS_OPTIONS)],
            ]);

            $sale = $this->saleWorkflowService->update(
                $sale,
                ['status' => $validated['status']],
                $request->user()
            );
        } else {
            $validated = $this->validateSalePayload($request, true);
            $sale = $this->saleWorkflowService->update(
                $sale,
                $this->buildSaleAttributes($validated),
                $request->user()
            );
        }

        $customerLabel = $sale->customer?->name ?? $sale->cliente_nome;
        $acao = $sale->status === Sale::STATUS_CANCELADA && $statusAnterior !== Sale::STATUS_CANCELADA
            ? "Venda cancelada: {$sale->protocolo}"
            : "Venda editada: {$sale->protocolo} ({$statusAnterior} -> {$sale->status}) para {$customerLabel}";

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'vendas',
            $acao,
            ['sale_id' => $sale->id, 'status' => $sale->status]
        );

        return $sale;
    }

    public function destroy(Request $request, string $id)
    {
        $sale = Sale::findOrFail($id);
        $sale = $this->saleWorkflowService->cancel($sale, $request->user());

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'vendas',
            "Venda cancelada por exclusão lógica: {$sale->protocolo}",
            ['sale_id' => $sale->id, 'status' => $sale->status]
        );

        return response()->json([
            'message' => 'Venda cancelada com sucesso.',
            'sale' => $sale,
        ]);
    }

    private function validateSalePayload(Request $request, bool $requireStatus = false): array
    {
        return $request->validate([
            'id_cliente' => ['nullable', 'integer', 'exists:customers,id'],
            'cliente_nome' => ['nullable', 'required_without:id_cliente', 'string', 'max:255'],
            'data_hora' => ['required', 'date'],
            'total' => ['required', 'numeric', 'min:0'],
            'forma_pagamento' => ['required', 'string', 'max:255'],
            'status' => [$requireStatus ? 'required' : 'nullable', Rule::in(Sale::STATUS_OPTIONS)],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.id_produto' => ['required', 'integer', 'exists:products,id'],
            'itens.*.nome' => ['required', 'string', 'max:255'],
            'itens.*.preco_unitario' => ['required', 'numeric', 'min:0'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1'],
            'itens.*.subtotal' => ['nullable', 'numeric', 'min:0'],
        ]);
    }

    private function buildSaleAttributes(array $validated): array
    {
        $customer = isset($validated['id_cliente'])
            ? Customer::find($validated['id_cliente'])
            : null;
        $items = $this->normalizeItems($validated['itens']);

        return [
            'id_cliente' => $customer?->id,
            'cliente_nome' => $customer?->name ?? $validated['cliente_nome'],
            'data_hora' => $validated['data_hora'],
            'total' => $this->calculateTotal($items),
            'forma_pagamento' => $validated['forma_pagamento'],
            'status' => $validated['status'] ?? Sale::STATUS_ABERTA,
            'itens' => $items,
        ];
    }

    private function normalizeItems(array $items): array
    {
        return array_map(function (array $item) {
            $unitPrice = round((float) $item['preco_unitario'], 2);
            $quantity = (int) $item['quantidade'];

            return [
                'id_produto' => (int) $item['id_produto'],
                'nome' => $item['nome'],
                'preco_unitario' => $unitPrice,
                'quantidade' => $quantity,
                'subtotal' => round($unitPrice * $quantity, 2),
            ];
        }, $items);
    }

    private function calculateTotal(array $items): float
    {
        return round(array_reduce(
            $items,
            fn (float $carry, array $item) => $carry + (float) $item['subtotal'],
            0
        ), 2);
    }
}
