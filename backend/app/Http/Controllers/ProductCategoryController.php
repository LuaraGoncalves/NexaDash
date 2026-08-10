<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\ProductCategory;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;

class ProductCategoryController extends Controller
{
    public function index()
    {
        return ProductCategory::query()
            ->latest('id')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string', 'max:255'],
        ]);

        $category = ProductCategory::create($validated);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Categoria criada: {$category->nome}",
            ['category_id' => $category->id]
        );

        return $category;
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
            'descricao' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $category = ProductCategory::findOrFail($id);
        $category->update($validated);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Categoria atualizada: {$category->nome}",
            ['category_id' => $category->id]
        );

        return $category;
    }

    public function destroy(Request $request, string $id)
    {
        $category = ProductCategory::findOrFail($id);
        $categoryName = $category->nome;
        $categoryId = $category->id;

        try {
            $category->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Não foi possível excluir a categoria porque ela está vinculada a outros registros.',
            ], 409);
        }

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Categoria excluída: {$categoryName}",
            ['category_id' => $categoryId]
        );

        return response()->json([
            'message' => 'Categoria excluída com sucesso.',
        ]);
    }
}
