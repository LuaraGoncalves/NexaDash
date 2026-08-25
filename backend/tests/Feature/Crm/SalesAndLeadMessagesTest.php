<?php

namespace Tests\Feature\Crm;

use App\Models\Customer;
use App\Models\FinancialTransaction;
use App\Models\InventoryMovement;
use App\Models\Lead;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SalesAndLeadMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_create_sale_and_sync_stock_and_financial_data(): void
    {
        $customer = Customer::create([
            'name' => 'Cliente Teste',
            'status' => 'ativo',
        ]);
        $product = $this->createProduct([
            'nome' => 'Produto teste',
            'preco_venda' => 149.90,
            'quantidade' => 5,
        ]);

        $response = $this->postJson('/api/crm/sales', [
            'id_cliente' => $customer->id,
            'data_hora' => '2026-08-13 10:30',
            'total' => 149.90,
            'forma_pagamento' => 'PIX',
            'status' => 'Concluída',
            'itens' => [
                [
                    'id_produto' => $product->id,
                    'nome' => $product->nome,
                    'preco_unitario' => 149.90,
                    'quantidade' => 1,
                    'subtotal' => 149.90,
                ],
            ],
        ], $this->employeeHeaders());

        $response
            ->assertOk()
            ->assertJsonPath('cliente_nome', 'Cliente Teste')
            ->assertJsonPath('status', 'Concluída');

        $protocol = $response->json('protocolo');

        $this->assertNotEmpty($protocol);
        $this->assertDatabaseHas('sales', [
            'cliente_nome' => 'Cliente Teste',
            'forma_pagamento' => 'PIX',
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'quantidade' => 4,
        ]);
        $this->assertDatabaseHas('inventory_movements', [
            'id_produto' => $product->id,
            'tipo' => InventoryMovement::TIPO_SAIDA,
            'quantidade' => 1,
            'motivo' => "Venda {$protocol}",
        ]);
        $this->assertDatabaseHas('financial_transactions', [
            'protocolo_venda' => $protocol,
            'tipo' => FinancialTransaction::TIPO_RECEITA,
            'status' => FinancialTransaction::STATUS_PAGO,
            'forma_pagamento' => 'PIX',
        ]);
    }

    public function test_employee_can_store_real_lead_message(): void
    {
        $lead = Lead::create([
            'name' => 'Lead Teste',
            'phone' => '11999999999',
            'email' => 'lead@nexadash.test',
            'status' => Lead::STATUS_NOVO,
        ]);

        $this->postJson("/api/crm/leads/{$lead->id}/messages", [
            'sender_type' => 'team',
            'sender_name' => 'Atendente Teste',
            'message' => 'Oi! Posso te ajudar com a sua compra.',
        ], $this->employeeHeaders())
            ->assertOk()
            ->assertJsonPath('lead_id', $lead->id)
            ->assertJsonPath('sender_type', 'team')
            ->assertJsonPath('message', 'Oi! Posso te ajudar com a sua compra.');

        $this->assertDatabaseHas('lead_messages', [
            'lead_id' => $lead->id,
            'sender_name' => 'Atendente Teste',
            'message' => 'Oi! Posso te ajudar com a sua compra.',
        ]);
    }

    public function test_manager_can_edit_sale_customer_payment_status_and_items(): void
    {
        $customer = Customer::create([
            'name' => 'Cliente Original',
            'status' => 'ativo',
        ]);

        $updatedCustomer = Customer::create([
            'name' => 'Cliente Atualizada',
            'status' => 'ativo',
        ]);
        $produtoOriginal = $this->createProduct([
            'nome' => 'Produto original',
            'preco_venda' => 149.90,
            'quantidade' => 10,
        ]);
        $produtoAtualizado = $this->createProduct([
            'nome' => 'Produto atualizado',
            'preco_venda' => 144.90,
            'quantidade' => 8,
        ]);

        $saleResponse = $this->postJson('/api/crm/sales', [
            'id_cliente' => $customer->id,
            'data_hora' => '2026-08-13 10:30',
            'total' => 149.90,
            'forma_pagamento' => 'PIX',
            'status' => 'Concluída',
            'itens' => [
                [
                    'id_produto' => $produtoOriginal->id,
                    'nome' => $produtoOriginal->nome,
                    'preco_unitario' => 149.90,
                    'quantidade' => 1,
                    'subtotal' => 149.90,
                ],
            ],
        ], $this->employeeHeaders())->assertOk();

        $saleId = $saleResponse->json('id');
        $protocol = $saleResponse->json('protocolo');

        $this->putJson("/api/crm/sales/{$saleId}", [
            'id_cliente' => $updatedCustomer->id,
            'data_hora' => '2026-08-13 11:15',
            'total' => 289.80,
            'forma_pagamento' => 'Cartão de Crédito',
            'status' => 'Concluída',
            'itens' => [
                [
                    'id_produto' => $produtoAtualizado->id,
                    'nome' => $produtoAtualizado->nome,
                    'preco_unitario' => 144.90,
                    'quantidade' => 2,
                    'subtotal' => 289.80,
                ],
            ],
        ], $this->managerHeaders())
            ->assertOk()
            ->assertJsonPath('id_cliente', $updatedCustomer->id)
            ->assertJsonPath('cliente_nome', 'Cliente Atualizada')
            ->assertJsonPath('forma_pagamento', 'Cartão de Crédito')
            ->assertJsonPath('status', 'Concluída')
            ->assertJsonPath('itens.0.nome', 'Produto atualizado');

        $this->assertDatabaseHas('sales', [
            'id' => $saleId,
            'id_cliente' => $updatedCustomer->id,
            'cliente_nome' => 'Cliente Atualizada',
            'forma_pagamento' => 'Cartão de Crédito',
            'status' => 'Concluída',
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $produtoOriginal->id,
            'quantidade' => 10,
        ]);
        $this->assertDatabaseHas('products', [
            'id' => $produtoAtualizado->id,
            'quantidade' => 6,
        ]);
        $this->assertDatabaseHas('financial_transactions', [
            'protocolo_venda' => $protocol,
            'descricao' => "Venda {$protocol} - Cliente Atualizada",
            'valor' => 289.80,
            'forma_pagamento' => 'Cartão de Crédito',
            'status' => FinancialTransaction::STATUS_PAGO,
        ]);
    }

    public function test_manager_can_cancel_sale_and_restore_stock(): void
    {
        $customer = Customer::create([
            'name' => 'Cliente Cancelamento',
            'status' => 'ativo',
        ]);
        $product = $this->createProduct([
            'nome' => 'Produto cancelavel',
            'preco_venda' => 80.00,
            'quantidade' => 7,
        ]);

        $saleResponse = $this->postJson('/api/crm/sales', [
            'id_cliente' => $customer->id,
            'data_hora' => '2026-08-13 12:00',
            'total' => 160.00,
            'forma_pagamento' => 'Dinheiro',
            'status' => 'Concluída',
            'itens' => [
                [
                    'id_produto' => $product->id,
                    'nome' => $product->nome,
                    'preco_unitario' => 80.00,
                    'quantidade' => 2,
                    'subtotal' => 160.00,
                ],
            ],
        ], $this->employeeHeaders())->assertOk();

        $saleId = $saleResponse->json('id');
        $protocol = $saleResponse->json('protocolo');

        $this->deleteJson("/api/crm/sales/{$saleId}", [], $this->managerHeaders())
            ->assertOk()
            ->assertJsonPath('sale.status', 'Cancelada');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'quantidade' => 7,
        ]);
        $this->assertDatabaseHas('inventory_movements', [
            'id_produto' => $product->id,
            'tipo' => InventoryMovement::TIPO_ENTRADA,
            'quantidade' => 2,
            'motivo' => "Estorno cancelamento {$protocol}",
        ]);
        $this->assertDatabaseHas('financial_transactions', [
            'protocolo_venda' => $protocol,
            'status' => FinancialTransaction::STATUS_CANCELADO,
        ]);
    }

    private function employeeHeaders(): array
    {
        $token = Str::random(40);

        User::factory()->create([
            'role' => 'employee',
            'status' => 'ativo',
            'api_token' => $token,
            'permissions' => [
                'ver_leads' => true,
                'editar_leads' => true,
                'excluir_leads' => false,
                'ver_financeiro' => false,
                'criar_usuario' => false,
            ],
        ]);

        return [
            'Authorization' => "Bearer {$token}",
        ];
    }

    private function managerHeaders(): array
    {
        $token = Str::random(40);

        User::factory()->create([
            'role' => 'manager',
            'status' => 'ativo',
            'api_token' => $token,
            'permissions' => [
                'ver_leads' => true,
                'editar_leads' => true,
                'excluir_leads' => true,
                'ver_financeiro' => false,
                'criar_usuario' => false,
            ],
        ]);

        return [
            'Authorization' => "Bearer {$token}",
        ];
    }

    private function createProduct(array $overrides = []): Product
    {
        $category = ProductCategory::create([
            'nome' => 'Categoria '.Str::random(5),
        ]);
        $supplier = Supplier::create([
            'nome' => 'Fornecedor '.Str::random(5),
            'status' => 'ativo',
        ]);
        $unit = Unit::create([
            'sigla' => strtoupper(Str::random(2)).rand(10, 99),
            'nome' => 'Unidade '.Str::random(4),
        ]);

        return Product::create(array_merge([
            'sku' => 'SKU-'.Str::upper(Str::random(6)),
            'nome' => 'Produto '.Str::random(4),
            'descricao' => 'Produto de teste',
            'preco_custo' => 50,
            'preco_venda' => 100,
            'quantidade' => 10,
            'estoque_minimo' => 2,
            'status' => Product::STATUS_ATIVO,
            'id_categoria' => $category->id,
            'id_fornecedor' => $supplier->id,
            'id_unidade' => $unit->id,
        ], $overrides));
    }
}
