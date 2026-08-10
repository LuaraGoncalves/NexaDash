<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\FinancialTransaction;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinancialTransactionController extends Controller
{
    public function index()
    {
        return FinancialTransaction::query()
            ->with('categoria')
            ->orderByDesc('data_vencimento')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $this->validateTransaction($request);

        $transaction = FinancialTransaction::create($this->normalizePayload($validated))
            ->load('categoria');

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'financeiro',
            "Lançamento financeiro criado: {$transaction->descricao}",
            ['transaction_id' => $transaction->id]
        );

        return $transaction;
    }

    public function update(Request $request, string $id)
    {
        $validated = $this->validateTransaction($request, true);

        $transaction = FinancialTransaction::findOrFail($id);
        $statusAnterior = $transaction->status;
        $transaction->update($this->normalizePayload($validated, true));
        $transaction->load('categoria');

        $acao = $transaction->status === FinancialTransaction::STATUS_CANCELADO
            ? "Lançamento financeiro cancelado: {$transaction->descricao}"
            : ($statusAnterior !== $transaction->status
                ? "Lançamento financeiro atualizado: {$transaction->descricao} ({$statusAnterior} -> {$transaction->status})"
                : "Lançamento financeiro atualizado: {$transaction->descricao}");

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'financeiro',
            $acao,
            ['transaction_id' => $transaction->id]
        );

        return $transaction;
    }

    public function destroy(Request $request, string $id)
    {
        $transaction = FinancialTransaction::findOrFail($id);
        $transaction->update([
            'status' => FinancialTransaction::STATUS_CANCELADO,
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'financeiro',
            "Lançamento financeiro cancelado por exclusão lógica: {$transaction->descricao}",
            ['transaction_id' => $transaction->id]
        );

        return response()->json([
            'message' => 'Lançamento financeiro cancelado com sucesso.',
            'transaction' => $transaction->fresh()->load('categoria'),
        ]);
    }

    private function validateTransaction(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'tipo' => [$required, Rule::in(FinancialTransaction::TIPOS)],
            'descricao' => [$required, 'string', 'max:255'],
            'valor' => [$required, 'numeric', 'min:0'],
            'data_vencimento' => [$required, 'date'],
            'data_pagamento' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'date'],
            'id_categoria' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'integer', 'exists:financial_categories,id'],
            'forma_pagamento' => [$required, 'string', 'max:255'],
            'status' => [$partial ? 'sometimes' : 'nullable', Rule::in(FinancialTransaction::STATUS_OPTIONS)],
            'protocolo_venda' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255'],
            'observacoes' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string'],
        ]);
    }

    private function normalizePayload(array $validated, bool $partial = false): array
    {
        if (! $partial && ! isset($validated['status'])) {
            $validated['status'] = isset($validated['data_pagamento'])
                ? FinancialTransaction::STATUS_PAGO
                : FinancialTransaction::STATUS_PENDENTE;
        }

        return $validated;
    }
}
