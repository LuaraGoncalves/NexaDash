<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index()
    {
        return Product::query()
            ->with(['categoria', 'fornecedor', 'unidade'])
            ->latest('id')
            ->get()
            ->map(fn (Product $product) => $this->formatProduct($product));
    }

    public function store(Request $request)
    {
        $validated = $this->validateProduct($request);

        $product = Product::create($validated)->load(['categoria', 'fornecedor', 'unidade']);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Produto criado: {$product->nome}",
            ['product_id' => $product->id]
        );

        return $this->formatProduct($product);
    }

    public function update(Request $request, string $id)
    {
        $validated = $this->validateProduct($request, true, $id);

        $product = Product::findOrFail($id);
        $statusAnterior = $product->status;
        $product->update($validated);
        $product->load(['categoria', 'fornecedor', 'unidade']);

        $acao = match (true) {
            $statusAnterior !== $product->status && $product->status === Product::STATUS_INATIVO => "Produto inativado: {$product->nome}",
            $statusAnterior !== $product->status && $product->status === Product::STATUS_ATIVO => "Produto reativado: {$product->nome}",
            default => "Produto atualizado: {$product->nome}",
        };

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            $acao,
            ['product_id' => $product->id]
        );

        return $this->formatProduct($product);
    }

    public function destroy(Request $request, string $id)
    {
        $product = Product::findOrFail($id);
        $product->update([
            'status' => Product::STATUS_INATIVO,
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Produto inativado por exclusão lógica: {$product->nome}",
            ['product_id' => $product->id]
        );

        return response()->json([
            'message' => 'Produto inativado com sucesso.',
            'product' => $this->formatProduct($product->fresh()->load(['categoria', 'fornecedor', 'unidade'])),
        ]);
    }

    private function validateProduct(Request $request, bool $partial = false, ?string $id = null): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'sku' => [$required, 'string', 'max:255', Rule::unique('products', 'sku')->ignore($id)],
            'nome' => [$required, 'string', 'max:255'],
            'descricao' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string'],
            'preco_custo' => [$required, 'numeric', 'min:0'],
            'preco_venda' => [$required, 'numeric', 'min:0'],
            'quantidade' => [$required, 'integer', 'min:0'],
            'estoque_minimo' => [$required, 'integer', 'min:0'],
            'status' => [$partial ? 'sometimes' : 'nullable', Rule::in(Product::STATUS_OPTIONS)],
            'id_categoria' => [$required, 'integer', 'exists:product_categories,id'],
            'id_fornecedor' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'integer', 'exists:suppliers,id'],
            'id_unidade' => [$required, 'integer', 'exists:units,id'],
            'foto_url' => [$partial ? 'sometimes' : 'nullable', 'nullable', 'string', 'max:255'],
        ]);
    }

    private function formatProduct(Product $product): array
    {
        return [
            'id' => $product->id,
            'sku' => $product->sku,
            'nome' => $product->nome,
            'descricao' => $product->descricao,
            'preco_custo' => (float) $product->preco_custo,
            'preco_venda' => (float) $product->preco_venda,
            'quantidade' => $product->quantidade,
            'estoque_minimo' => $product->estoque_minimo,
            'status' => $product->status,
            'id_categoria' => $product->id_categoria,
            'id_fornecedor' => $product->id_fornecedor,
            'id_unidade' => $product->id_unidade,
            'foto_url' => $product->foto_url,
            'baixo_estoque' => $product->status === Product::STATUS_ATIVO && $product->quantidade <= $product->estoque_minimo,
            'categoria' => $product->categoria,
            'fornecedor' => $product->fornecedor,
            'unidade' => $product->unidade,
        ];
    }
}
