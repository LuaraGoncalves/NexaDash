<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    public function index()
    {
        return Supplier::query()
            ->latest('id')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'cnpj_cpf' => ['nullable', 'string', 'max:255'],
            'contato' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in([Supplier::STATUS_ATIVO, Supplier::STATUS_INATIVO])],
        ]);

        $supplier = Supplier::create([
            ...$validated,
            'status' => $validated['status'] ?? Supplier::STATUS_ATIVO,
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Fornecedor criado: {$supplier->nome}",
            ['supplier_id' => $supplier->id]
        );

        return $supplier;
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'cnpj_cpf' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contato' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'required', Rule::in([Supplier::STATUS_ATIVO, Supplier::STATUS_INATIVO])],
        ]);

        $supplier = Supplier::findOrFail($id);
        $statusAnterior = $supplier->status;
        $supplier->update($validated);

        $acao = match (true) {
            $statusAnterior !== $supplier->status && $supplier->status === Supplier::STATUS_INATIVO => "Fornecedor inativado: {$supplier->nome}",
            $statusAnterior !== $supplier->status && $supplier->status === Supplier::STATUS_ATIVO => "Fornecedor reativado: {$supplier->nome}",
            default => "Fornecedor atualizado: {$supplier->nome}",
        };

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            $acao,
            ['supplier_id' => $supplier->id]
        );

        return $supplier;
    }

    public function destroy(Request $request, string $id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->update([
            'status' => Supplier::STATUS_INATIVO,
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Fornecedor inativado por exclusão lógica: {$supplier->nome}",
            ['supplier_id' => $supplier->id]
        );

        return response()->json([
            'message' => 'Fornecedor inativado com sucesso.',
            'supplier' => $supplier->fresh(),
        ]);
    }
}
