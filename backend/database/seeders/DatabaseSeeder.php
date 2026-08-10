<?php

namespace Database\Seeders;

use App\Models\FinancialCategory;
use App\Models\FinancialTransaction;
use App\Models\InventoryMovement;
use App\Models\Lead;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $admin = User::updateOrCreate(
            ['email' => 'admin@nexadash.local'],
            [
                'name' => 'Administrador',
                'role' => 'admin',
                'status' => 'ativo',
                'setor' => 'Geral',
                'permissions' => [
                    'ver_leads' => true,
                    'editar_leads' => true,
                    'excluir_leads' => true,
                    'ver_financeiro' => true,
                    'criar_usuario' => true,
                ],
                'last_login_at' => now(),
                'password' => 'password',
            ]
        );

        $caixa = User::updateOrCreate(
            ['email' => 'caixa@nexadash.local'],
            [
                'name' => 'Caixa',
                'role' => 'employee',
                'status' => 'ativo',
                'setor' => 'Vendas',
                'permissions' => [
                    'ver_leads' => true,
                    'editar_leads' => false,
                    'excluir_leads' => false,
                    'ver_financeiro' => false,
                    'criar_usuario' => false,
                ],
                'last_login_at' => now()->subDay(),
                'password' => 'password',
            ]
        );

        $manager = User::updateOrCreate(
            ['email' => 'gerente@nexadash.local'],
            [
                'name' => 'Gerente Comercial',
                'role' => 'manager',
                'status' => 'ativo',
                'setor' => 'Vendas',
                'permissions' => [
                    'ver_leads' => true,
                    'editar_leads' => true,
                    'excluir_leads' => false,
                    'ver_financeiro' => false,
                    'criar_usuario' => false,
                ],
                'last_login_at' => now()->subHours(3),
                'password' => 'password',
            ]
        );

        $finance = User::updateOrCreate(
            ['email' => 'financeiro@nexadash.local'],
            [
                'name' => 'Financeiro',
                'role' => 'finance',
                'status' => 'ativo',
                'setor' => 'Financeiro',
                'permissions' => [
                    'ver_leads' => false,
                    'editar_leads' => false,
                    'excluir_leads' => false,
                    'ver_financeiro' => true,
                    'criar_usuario' => false,
                ],
                'last_login_at' => now()->subHours(5),
                'password' => 'password',
            ]
        );

        if (Schema::hasTable('leads')) {
            foreach ([
                ['name' => 'Maria Silva', 'phone' => '(11) 98888-7777', 'email' => 'maria@lead.com', 'status' => Lead::STATUS_NOVO],
                ['name' => 'João Pedro', 'phone' => '(21) 97777-6666', 'email' => 'joao@lead.com', 'status' => Lead::STATUS_NEGOCIACAO],
                ['name' => 'Ana Souza', 'phone' => '(31) 96666-5555', 'email' => 'ana@lead.com', 'status' => Lead::STATUS_AGUARDANDO],
                ['name' => 'Pedro Lima', 'phone' => '(41) 95555-4444', 'email' => 'pedro@lead.com', 'status' => Lead::STATUS_CONCLUIDO],
            ] as $leadData) {
                Lead::updateOrCreate(
                    ['email' => $leadData['email']],
                    $leadData
                );
            }
        }

        if (Schema::hasTable('sales')) {
            foreach ([
                [
                    'protocolo' => 'VND-20260807-001',
                    'id_cliente' => 1,
                    'cliente_nome' => 'Maria Silva',
                    'data_hora' => '2026-08-07 09:30',
                    'total' => 2545.00,
                    'forma_pagamento' => 'PIX',
                    'status' => Sale::STATUS_CONCLUIDA,
                    'itens' => [
                        ['id_produto' => 1, 'nome' => 'Smartphone Alpha X', 'preco_unitario' => 2500.00, 'quantidade' => 1, 'subtotal' => 2500.00],
                        ['id_produto' => 2, 'nome' => 'Cabo USB-C Turbo', 'preco_unitario' => 45.00, 'quantidade' => 1, 'subtotal' => 45.00],
                    ],
                ],
                [
                    'protocolo' => 'VND-20260807-002',
                    'id_cliente' => 2,
                    'cliente_nome' => 'Consumidor Final',
                    'data_hora' => '2026-08-07 11:10',
                    'total' => 60.00,
                    'forma_pagamento' => 'Cartão de Débito',
                    'status' => Sale::STATUS_CONCLUIDA,
                    'itens' => [
                        ['id_produto' => 4, 'nome' => 'Película de Vidro', 'preco_unitario' => 30.00, 'quantidade' => 2, 'subtotal' => 60.00],
                    ],
                ],
            ] as $saleData) {
                Sale::updateOrCreate(
                    ['protocolo' => $saleData['protocolo']],
                    $saleData
                );
            }
        }

        if (
            Schema::hasTable('product_categories') &&
            Schema::hasTable('suppliers') &&
            Schema::hasTable('units') &&
            Schema::hasTable('products')
        ) {
            $categoriaEletronicos = ProductCategory::updateOrCreate(
                ['nome' => 'Eletrônicos'],
                ['descricao' => 'Equipamentos e gadgets']
            );
            $categoriaAcessorios = ProductCategory::updateOrCreate(
                ['nome' => 'Acessórios'],
                ['descricao' => 'Capas, cabos e películas']
            );
            $categoriaServicos = ProductCategory::updateOrCreate(
                ['nome' => 'Serviços'],
                ['descricao' => 'Aplicações e atendimentos']
            );

            $fornecedorTech = Supplier::updateOrCreate(
                ['nome' => 'Tech Distribuidora S.A'],
                ['cnpj_cpf' => '12.345.678/0001-90', 'contato' => '(11) 98765-4321', 'status' => 'ativo']
            );
            $fornecedorImports = Supplier::updateOrCreate(
                ['nome' => 'Imports Brasil'],
                ['cnpj_cpf' => '98.765.432/0001-10', 'contato' => '(21) 99999-8888', 'status' => 'ativo']
            );

            $unidade = Unit::updateOrCreate(['sigla' => 'UN'], ['nome' => 'Unidade']);
            Unit::updateOrCreate(['sigla' => 'CX'], ['nome' => 'Caixa']);

            $smartphone = Product::updateOrCreate(
                ['sku' => 'EL-001'],
                [
                    'nome' => 'Smartphone Alpha X',
                    'descricao' => '128GB, Tela 6.5, Câmera 48MP',
                    'preco_custo' => 1200.00,
                    'preco_venda' => 2500.00,
                    'quantidade' => 15,
                    'estoque_minimo' => 5,
                    'status' => 'ativo',
                    'id_categoria' => $categoriaEletronicos->id,
                    'id_fornecedor' => $fornecedorTech->id,
                    'id_unidade' => $unidade->id,
                ]
            );

            $cabo = Product::updateOrCreate(
                ['sku' => 'AC-102'],
                [
                    'nome' => 'Cabo USB-C Turbo',
                    'descricao' => '2 metros, blindado',
                    'preco_custo' => 15.50,
                    'preco_venda' => 45.00,
                    'quantidade' => 20,
                    'estoque_minimo' => 10,
                    'status' => 'ativo',
                    'id_categoria' => $categoriaAcessorios->id,
                    'id_fornecedor' => $fornecedorImports->id,
                    'id_unidade' => $unidade->id,
                ]
            );

            Product::updateOrCreate(
                ['sku' => 'SV-001'],
                [
                    'nome' => 'Película de Vidro',
                    'descricao' => 'Aplicação simples no balcão',
                    'preco_custo' => 8.00,
                    'preco_venda' => 30.00,
                    'quantidade' => 40,
                    'estoque_minimo' => 8,
                    'status' => 'ativo',
                    'id_categoria' => $categoriaServicos->id,
                    'id_fornecedor' => $fornecedorTech->id,
                    'id_unidade' => $unidade->id,
                ]
            );

            if (Schema::hasTable('inventory_movements')) {
                InventoryMovement::updateOrCreate(
                    ['id_produto' => $smartphone->id, 'motivo' => 'Compra de fornecedor'],
                    [
                        'id_usuario' => $admin->id,
                        'tipo' => 'entrada',
                        'quantidade' => 20,
                        'data_hora' => now()->subDays(4),
                        'responsavel' => $admin->name,
                    ]
                );

                InventoryMovement::updateOrCreate(
                    ['id_produto' => $cabo->id, 'motivo' => 'Venda balcão'],
                    [
                        'id_usuario' => $caixa->id,
                        'tipo' => 'saida',
                        'quantidade' => 5,
                        'data_hora' => now()->subDays(2),
                        'responsavel' => $caixa->name,
                    ]
                );
            }
        }

        if (Schema::hasTable('financial_categories') && Schema::hasTable('financial_transactions')) {
            $categoriaVenda = FinancialCategory::updateOrCreate(
                ['nome' => 'Vendas (PDV)'],
                ['tipo' => 'receita', 'cor' => 'bg-green-500']
            );
            $categoriaFornecedor = FinancialCategory::updateOrCreate(
                ['nome' => 'Fornecedores'],
                ['tipo' => 'despesa', 'cor' => 'bg-orange-500']
            );
            $categoriaAluguel = FinancialCategory::updateOrCreate(
                ['nome' => 'Aluguel/Infraestrutura'],
                ['tipo' => 'despesa', 'cor' => 'bg-yellow-500']
            );

            FinancialTransaction::updateOrCreate(
                ['descricao' => 'Venda de Smartphone + Acessórios'],
                [
                    'tipo' => 'receita',
                    'valor' => 2545.00,
                    'data_vencimento' => '2026-08-07',
                    'data_pagamento' => '2026-08-07',
                    'id_categoria' => $categoriaVenda->id,
                    'forma_pagamento' => 'PIX',
                    'status' => 'Pago',
                    'protocolo_venda' => 'VND-20260807-001',
                ]
            );

            FinancialTransaction::updateOrCreate(
                ['descricao' => 'Pagamento de aluguel'],
                [
                    'tipo' => 'despesa',
                    'valor' => 1500.00,
                    'data_vencimento' => '2026-08-10',
                    'id_categoria' => $categoriaAluguel->id,
                    'forma_pagamento' => 'Boleto',
                    'status' => 'Pendente',
                    'observacoes' => 'Boleto em aberto',
                ]
            );

            FinancialTransaction::updateOrCreate(
                ['descricao' => 'Compra lote de cabos'],
                [
                    'tipo' => 'despesa',
                    'valor' => 850.00,
                    'data_vencimento' => '2026-08-06',
                    'data_pagamento' => '2026-08-06',
                    'id_categoria' => $categoriaFornecedor->id,
                    'forma_pagamento' => 'Transferência',
                    'status' => 'Pago',
                ]
            );
        }

    }
}
