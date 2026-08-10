<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\FinancialCategory;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinancialCategoryController extends Controller
{
    public function index()
    {
        return FinancialCategory::query()
            ->latest('id')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'tipo' => ['required', Rule::in(FinancialCategory::TIPOS)],
            'cor' => ['nullable', 'string', 'max:255'],
        ]);

        $category = FinancialCategory::create([
            ...$validated,
            'cor' => $validated['cor'] ?? 'bg-gray-500',
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'financeiro',
            "Categoria financeira criada: {$category->nome}",
            ['financial_category_id' => $category->id]
        );

        return $category;
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'tipo' => ['sometimes', 'required', Rule::in(FinancialCategory::TIPOS)],
            'cor' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $category = FinancialCategory::findOrFail($id);
        $category->update($validated);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'financeiro',
            "Categoria financeira atualizada: {$category->nome}",
            ['financial_category_id' => $category->id]
        );

        return $category;
    }

    public function destroy(Request $request, string $id)
    {
        $category = FinancialCategory::findOrFail($id);
        $categoryName = $category->nome;
        $categoryId = $category->id;

        try {
            $category->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Não foi possível excluir a categoria financeira porque ela está vinculada a outros registros.',
            ], 409);
        }

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'financeiro',
            "Categoria financeira excluída: {$categoryName}",
            ['financial_category_id' => $categoryId]
        );

        return response()->json([
            'message' => 'Categoria financeira excluída com sucesso.',
        ]);
    }
}
