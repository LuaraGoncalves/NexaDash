<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\InventoryMovement;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class InventoryMovementController extends Controller
{
    public function index()
    {
        return InventoryMovement::query()
            ->with(['produto', 'usuario'])
            ->latest('data_hora')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_produto' => ['required', 'integer', 'exists:products,id'],
            'tipo' => ['required', Rule::in(InventoryMovement::TIPOS)],
            'quantidade' => ['required', 'integer', 'min:1'],
            'data_hora' => ['nullable', 'date'],
            'motivo' => ['required', 'string', 'max:255'],
            'responsavel' => ['nullable', 'string', 'max:255'],
        ]);

        $movement = DB::transaction(function () use ($request, $validated) {
            $product = Product::findOrFail($validated['id_produto']);
            $delta = $validated['tipo'] === InventoryMovement::TIPO_ENTRADA
                ? $validated['quantidade']
                : $validated['quantidade'] * -1;

            if ($validated['tipo'] === InventoryMovement::TIPO_SAIDA && $product->quantidade < $validated['quantidade']) {
                throw ValidationException::withMessages([
                    'quantidade' => 'Estoque insuficiente para realizar esta saída.',
                ]);
            }

            $product->update([
                'quantidade' => $product->quantidade + $delta,
            ]);

            $movement = InventoryMovement::create([
                'id_produto' => $product->id,
                'id_usuario' => $request->user()?->id,
                'tipo' => $validated['tipo'],
                'quantidade' => $validated['quantidade'],
                'data_hora' => $validated['data_hora'] ?? now(),
                'motivo' => $validated['motivo'],
                'responsavel' => $validated['responsavel'] ?? $request->user()?->name ?? 'Sistema',
            ]);

            AuditLog::record(
                $request->user()?->id,
                $request->user()?->name ?? 'Sistema',
                'estoque',
                $validated['tipo'] === InventoryMovement::TIPO_ENTRADA
                    ? "Entrada de estoque registrada: {$validated['quantidade']} un. em {$product->nome}"
                    : "Saída de estoque registrada: {$validated['quantidade']} un. de {$product->nome}",
                ['movement_id' => $movement->id, 'product_id' => $product->id]
            );

            return $movement->load(['produto', 'usuario']);
        });

        return $movement;
    }

    public function destroy(Request $request, string $id)
    {
        DB::transaction(function () use ($request, $id) {
            $movement = InventoryMovement::findOrFail($id);
            $product = Product::findOrFail($movement->id_produto);

            $delta = $movement->tipo === InventoryMovement::TIPO_ENTRADA
                ? $movement->quantidade * -1
                : $movement->quantidade;

            if ($movement->tipo === InventoryMovement::TIPO_SAIDA && $delta > 0) {
                $product->update([
                    'quantidade' => $product->quantidade + $delta,
                ]);
            } elseif ($movement->tipo === InventoryMovement::TIPO_ENTRADA) {
                if ($product->quantidade < $movement->quantidade) {
                    throw ValidationException::withMessages([
                        'movement' => 'Não foi possível excluir a movimentação porque o estoque atual é menor que a entrada registrada.',
                    ]);
                }

                $product->update([
                    'quantidade' => $product->quantidade + $delta,
                ]);
            }

            $movementId = $movement->id;
            $movementTipo = $movement->tipo;
            $productName = $product->nome;
            $movementQuantidade = $movement->quantidade;
            $movement->delete();

            AuditLog::record(
                $request->user()?->id,
                $request->user()?->name ?? 'Sistema',
                'estoque',
                "Movimentação excluída: {$movementTipo} de {$movementQuantidade} un. em {$productName}",
                ['movement_id' => $movementId, 'product_id' => $product->id]
            );
        });

        return response()->json([
            'message' => 'Movimentação excluída com sucesso.',
        ]);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'id_produto' => ['required', 'integer', 'exists:products,id'],
            'tipo' => ['required', Rule::in(InventoryMovement::TIPOS)],
            'quantidade' => ['required', 'integer', 'min:1'],
            'data_hora' => ['nullable', 'date'],
            'motivo' => ['required', 'string', 'max:255'],
            'responsavel' => ['nullable', 'string', 'max:255'],
        ]);

        $movement = DB::transaction(function () use ($request, $validated, $id) {
            $movement = InventoryMovement::findOrFail($id);
            $produtoAnterior = Product::findOrFail($movement->id_produto);

            $rollbackDelta = $movement->tipo === InventoryMovement::TIPO_ENTRADA
                ? $movement->quantidade * -1
                : $movement->quantidade;

            if ($movement->tipo === InventoryMovement::TIPO_ENTRADA && $produtoAnterior->quantidade < $movement->quantidade) {
                throw ValidationException::withMessages([
                    'quantidade' => 'Não foi possível editar a movimentação porque o estoque atual é menor que a entrada original.',
                ]);
            }

            $produtoAnterior->update([
                'quantidade' => $produtoAnterior->quantidade + $rollbackDelta,
            ]);

            $produtoNovo = Product::findOrFail($validated['id_produto']);
            $applyDelta = $validated['tipo'] === InventoryMovement::TIPO_ENTRADA
                ? $validated['quantidade']
                : $validated['quantidade'] * -1;

            if ($validated['tipo'] === InventoryMovement::TIPO_SAIDA && $produtoNovo->quantidade < $validated['quantidade']) {
                throw ValidationException::withMessages([
                    'quantidade' => 'Estoque insuficiente para editar essa saída.',
                ]);
            }

            $produtoNovo->update([
                'quantidade' => $produtoNovo->quantidade + $applyDelta,
            ]);

            $movement->update([
                'id_produto' => $produtoNovo->id,
                'tipo' => $validated['tipo'],
                'quantidade' => $validated['quantidade'],
                'data_hora' => $validated['data_hora'] ?? $movement->data_hora,
                'motivo' => $validated['motivo'],
                'responsavel' => $validated['responsavel'] ?? $request->user()?->name ?? 'Sistema',
            ]);

            AuditLog::record(
                $request->user()?->id,
                $request->user()?->name ?? 'Sistema',
                'estoque',
                "Movimentação atualizada: {$movement->tipo} de {$movement->quantidade} un. em {$produtoNovo->nome}",
                ['movement_id' => $movement->id, 'product_id' => $produtoNovo->id]
            );

            return $movement->fresh()->load(['produto', 'usuario']);
        });

        return $movement;
    }
}
