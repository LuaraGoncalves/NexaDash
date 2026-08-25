<?php

namespace Database\Seeders;

use App\Models\FinancialCategory;
use App\Models\ProductCategory;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class ReferenceDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedProductReferences();
        $this->seedFinancialReferences();
    }

    private function seedProductReferences(): void
    {
        if (! Schema::hasTable('product_categories') || ! Schema::hasTable('units')) {
            return;
        }

        foreach ($this->productCategories() as $category) {
            ProductCategory::updateOrCreate(
                ['nome' => $category['nome']],
                ['descricao' => $category['descricao']]
            );
        }

        foreach ($this->units() as $unit) {
            Unit::updateOrCreate(
                ['sigla' => $unit['sigla']],
                ['nome' => $unit['nome']]
            );
        }
    }

    private function seedFinancialReferences(): void
    {
        if (! Schema::hasTable('financial_categories')) {
            return;
        }

        foreach ($this->financialCategories() as $category) {
            FinancialCategory::updateOrCreate(
                ['nome' => $category['nome']],
                [
                    'tipo' => $category['tipo'],
                    'cor' => $category['cor'],
                ]
            );
        }
    }

    private function productCategories(): array
    {
        return [
            ['nome' => 'Produtos', 'descricao' => 'Itens vendidos no PDV'],
            ['nome' => 'Serviços', 'descricao' => 'Atendimentos e serviços comerciais'],
            ['nome' => 'Acessórios', 'descricao' => 'Itens complementares de venda'],
        ];
    }

    private function units(): array
    {
        return [
            ['sigla' => 'UN', 'nome' => 'Unidade'],
            ['sigla' => 'CX', 'nome' => 'Caixa'],
            ['sigla' => 'SV', 'nome' => 'Serviço'],
        ];
    }

    private function financialCategories(): array
    {
        return [
            ['nome' => 'Vendas (PDV)', 'tipo' => FinancialCategory::TIPO_RECEITA, 'cor' => 'bg-emerald-500'],
            ['nome' => 'Fornecedores', 'tipo' => FinancialCategory::TIPO_DESPESA, 'cor' => 'bg-orange-500'],
            ['nome' => 'Operacional', 'tipo' => FinancialCategory::TIPO_DESPESA, 'cor' => 'bg-sky-500'],
        ];
    }
}
