<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SaleController extends Controller
{
    public function index()
    {
        return Sale::query()
            ->with('customer')
            ->latest('id')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_cliente' => ['nullable', 'integer', 'exists:customers,id'],
            'cliente_nome' => ['nullable', 'required_without:id_cliente', 'string', 'max:255'],
            'data_hora' => ['required', 'string', 'max:255'],
            'total' => ['required', 'numeric', 'min:0'],
            'forma_pagamento' => ['required', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Sale::STATUS_OPTIONS)],
            'itens' => ['required', 'array', 'min:1'],
            'itens.*.id_produto' => ['required', 'integer'],
            'itens.*.nome' => ['required', 'string', 'max:255'],
            'itens.*.preco_unitario' => ['required', 'numeric', 'min:0'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1'],
            'itens.*.subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $customer = isset($validated['id_cliente'])
            ? Customer::find($validated['id_cliente'])
            : null;

        $sale = Sale::create([
            'id_cliente' => $customer?->id,
            'cliente_nome' => $customer?->name ?? $validated['cliente_nome'],
            'data_hora' => $validated['data_hora'],
            'total' => $validated['total'],
            'forma_pagamento' => $validated['forma_pagamento'],
            'status' => $validated['status'] ?? Sale::STATUS_ABERTA,
            'itens' => $validated['itens'],
        ]);

        $sale->update([
            'protocolo' => $this->generateProtocol($sale),
        ]);

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
        $validated = $request->validate([
            'status' => ['required', Rule::in(Sale::STATUS_OPTIONS)],
        ]);

        $sale = Sale::findOrFail($id);
        $statusAnterior = $sale->status;
        $sale->update([
            'status' => $validated['status'],
        ]);

        $acao = $sale->status === Sale::STATUS_CANCELADA
            ? "Venda cancelada: {$sale->protocolo}"
            : "Venda atualizada: {$sale->protocolo} ({$statusAnterior} -> {$sale->status})";

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'vendas',
            $acao,
            ['sale_id' => $sale->id, 'status' => $sale->status]
        );

        return $sale->load('customer');
    }

    public function destroy(Request $request, string $id)
    {
        $sale = Sale::findOrFail($id);

        if ($sale->status !== Sale::STATUS_CANCELADA) {
            $sale->update([
                'status' => Sale::STATUS_CANCELADA,
            ]);
        }

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'vendas',
            "Venda cancelada por exclusão lógica: {$sale->protocolo}",
            ['sale_id' => $sale->id, 'status' => $sale->status]
        );

        return response()->json([
            'message' => 'Venda cancelada com sucesso.',
            'sale' => $sale->fresh()->load('customer'),
        ]);
    }

    private function generateProtocol(Sale $sale): string
    {
        $datePart = now()->format('Ymd');
        $idPart = str_pad((string) $sale->id, 3, '0', STR_PAD_LEFT);

        return "VND-{$datePart}-{$idPart}";
    }
}
