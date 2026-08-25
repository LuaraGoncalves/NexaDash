<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\FinancialCategory;
use App\Models\FinancialTransaction;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleWorkflowService
{
    public function create(array $attributes, ?User $user): Sale
    {
        return DB::transaction(function () use ($attributes, $user) {
            $sale = Sale::create($attributes);

            if (! $sale->protocolo) {
                $sale->update([
                    'protocolo' => $this->generateProtocol($sale),
                ]);
            }

            if ($this->isCompleted($sale->status)) {
                $this->applySaleEffects($sale, $user);
            } else {
                $this->cancelLinkedFinancialTransaction($sale, $user, false);
            }

            return $sale->fresh()->load('customer');
        });
    }

    public function update(Sale $sale, array $attributes, ?User $user): Sale
    {
        return DB::transaction(function () use ($sale, $attributes, $user) {
            $wasCompleted = $this->isCompleted($sale->status);

            if ($wasCompleted) {
                $this->revertSaleEffects($sale, $user, 'ajuste');
            }

            $sale->update($attributes);

            if (! $sale->protocolo) {
                $sale->update([
                    'protocolo' => $this->generateProtocol($sale),
                ]);
            }

            if ($this->isCompleted($sale->status)) {
                $this->applySaleEffects($sale, $user);
            } else {
                $this->cancelLinkedFinancialTransaction($sale, $user, $wasCompleted);
            }

            return $sale->fresh()->load('customer');
        });
    }

    public function cancel(Sale $sale, ?User $user): Sale
    {
        return DB::transaction(function () use ($sale, $user) {
            $wasCompleted = $this->isCompleted($sale->status);

            if ($wasCompleted) {
                $this->revertSaleEffects($sale, $user, 'cancelamento');
            }

            if ($sale->status !== Sale::STATUS_CANCELADA) {
                $sale->update([
                    'status' => Sale::STATUS_CANCELADA,
                ]);
            }

            $this->cancelLinkedFinancialTransaction($sale, $user, $wasCompleted);

            return $sale->fresh()->load('customer');
        });
    }

    private function applySaleEffects(Sale $sale, ?User $user): void
    {
        foreach ($this->aggregateItems($sale->itens ?? []) as $productId => $quantity) {
            $product = Product::query()->lockForUpdate()->findOrFail($productId);

            if ($product->status !== Product::STATUS_ATIVO) {
                throw ValidationException::withMessages([
                    'itens' => "O produto {$product->nome} está inativo e não pode ser vendido.",
                ]);
            }

            if ($product->quantidade < $quantity) {
                throw ValidationException::withMessages([
                    'itens' => "Estoque insuficiente para {$product->nome}. Disponível: {$product->quantidade}.",
                ]);
            }

            $product->update([
                'quantidade' => $product->quantidade - $quantity,
            ]);

            InventoryMovement::create([
                'id_produto' => $product->id,
                'id_usuario' => $user?->id,
                'tipo' => InventoryMovement::TIPO_SAIDA,
                'quantidade' => $quantity,
                'data_hora' => $this->resolveSaleDateTime($sale),
                'motivo' => "Venda {$sale->protocolo}",
                'responsavel' => $user?->name ?? 'Sistema',
            ]);
        }

        AuditLog::record(
            $user?->id,
            $user?->name ?? 'Sistema',
            'estoque',
            "Saída automática de estoque pela venda {$sale->protocolo}",
            ['sale_id' => $sale->id, 'protocolo' => $sale->protocolo]
        );

        $this->upsertLinkedFinancialTransaction($sale, $user);
    }

    private function revertSaleEffects(Sale $sale, ?User $user, string $context): void
    {
        foreach ($this->aggregateItems($sale->itens ?? []) as $productId => $quantity) {
            $product = Product::query()->lockForUpdate()->findOrFail($productId);

            $product->update([
                'quantidade' => $product->quantidade + $quantity,
            ]);

            InventoryMovement::create([
                'id_produto' => $product->id,
                'id_usuario' => $user?->id,
                'tipo' => InventoryMovement::TIPO_ENTRADA,
                'quantidade' => $quantity,
                'data_hora' => now(),
                'motivo' => "Estorno {$context} {$sale->protocolo}",
                'responsavel' => $user?->name ?? 'Sistema',
            ]);
        }

        AuditLog::record(
            $user?->id,
            $user?->name ?? 'Sistema',
            'estoque',
            "Estorno automático de estoque da venda {$sale->protocolo}",
            ['sale_id' => $sale->id, 'protocolo' => $sale->protocolo, 'contexto' => $context]
        );
    }

    private function upsertLinkedFinancialTransaction(Sale $sale, ?User $user): void
    {
        $saleDate = $this->resolveSaleDateTime($sale)->toDateString();
        $category = FinancialCategory::firstOrCreate(
            ['nome' => 'Vendas (PDV)'],
            [
                'tipo' => FinancialCategory::TIPO_RECEITA,
                'cor' => 'bg-emerald-500',
            ]
        );

        FinancialTransaction::updateOrCreate(
            ['protocolo_venda' => $sale->protocolo],
            [
                'tipo' => FinancialTransaction::TIPO_RECEITA,
                'descricao' => "Venda {$sale->protocolo} - {$sale->cliente_nome}",
                'valor' => $sale->total,
                'data_vencimento' => $saleDate,
                'data_pagamento' => $saleDate,
                'id_categoria' => $category->id,
                'forma_pagamento' => $sale->forma_pagamento,
                'status' => FinancialTransaction::STATUS_PAGO,
                'observacoes' => 'Receita gerada automaticamente pelo PDV.',
            ]
        );

        AuditLog::record(
            $user?->id,
            $user?->name ?? 'Sistema',
            'financeiro',
            "Receita automática sincronizada para a venda {$sale->protocolo}",
            ['sale_id' => $sale->id, 'protocolo' => $sale->protocolo]
        );
    }

    private function cancelLinkedFinancialTransaction(Sale $sale, ?User $user, bool $shouldLog): void
    {
        $transaction = FinancialTransaction::query()
            ->where('protocolo_venda', $sale->protocolo)
            ->first();

        if (! $transaction) {
            return;
        }

        $transaction->update([
            'status' => FinancialTransaction::STATUS_CANCELADO,
            'data_pagamento' => null,
        ]);

        if ($shouldLog) {
            AuditLog::record(
                $user?->id,
                $user?->name ?? 'Sistema',
                'financeiro',
                "Receita automática cancelada para a venda {$sale->protocolo}",
                ['sale_id' => $sale->id, 'protocolo' => $sale->protocolo]
            );
        }
    }

    private function aggregateItems(array $items): array
    {
        $aggregated = [];

        foreach ($items as $item) {
            $productId = (int) ($item['id_produto'] ?? 0);
            $quantity = (int) ($item['quantidade'] ?? 0);

            if ($productId <= 0 || $quantity <= 0) {
                continue;
            }

            $aggregated[$productId] = ($aggregated[$productId] ?? 0) + $quantity;
        }

        return $aggregated;
    }

    private function resolveSaleDateTime(Sale $sale): Carbon
    {
        try {
            return Carbon::parse($sale->data_hora);
        } catch (\Throwable) {
            return now();
        }
    }

    private function isCompleted(?string $status): bool
    {
        return $status === Sale::STATUS_CONCLUIDA;
    }

    private function generateProtocol(Sale $sale): string
    {
        $datePart = now()->format('Ymd');
        $idPart = str_pad((string) $sale->id, 3, '0', STR_PAD_LEFT);

        return "VND-{$datePart}-{$idPart}";
    }
}
