<?php

namespace Tests\Feature\Crm;

use App\Models\Customer;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SalesAndLeadMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_create_sale_and_receive_generated_protocol(): void
    {
        $customer = Customer::create([
            'name' => 'Cliente Teste',
            'status' => 'ativo',
        ]);

        $response = $this->postJson('/api/crm/sales', [
            'id_cliente' => $customer->id,
            'data_hora' => '2026-08-13 10:30',
            'total' => 149.90,
            'forma_pagamento' => 'PIX',
            'status' => 'Concluída',
            'itens' => [
                [
                    'id_produto' => 1,
                    'nome' => 'Produto teste',
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

        $this->assertNotEmpty($response->json('protocolo'));
        $this->assertDatabaseHas('sales', [
            'cliente_nome' => 'Cliente Teste',
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

        $sale = \App\Models\Sale::create([
            'protocolo' => 'VND-20260813-001',
            'id_cliente' => $customer->id,
            'cliente_nome' => $customer->name,
            'data_hora' => '2026-08-13 10:30',
            'total' => 149.90,
            'forma_pagamento' => 'PIX',
            'status' => 'Aberta',
            'itens' => [
                [
                    'id_produto' => 1,
                    'nome' => 'Produto original',
                    'preco_unitario' => 149.90,
                    'quantidade' => 1,
                    'subtotal' => 149.90,
                ],
            ],
        ]);

        $this->putJson("/api/crm/sales/{$sale->id}", [
            'id_cliente' => $updatedCustomer->id,
            'data_hora' => '2026-08-13 11:15',
            'total' => 289.80,
            'forma_pagamento' => 'Cartão de Crédito',
            'status' => 'Concluída',
            'itens' => [
                [
                    'id_produto' => 2,
                    'nome' => 'Produto atualizado',
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
            'id' => $sale->id,
            'id_cliente' => $updatedCustomer->id,
            'cliente_nome' => 'Cliente Atualizada',
            'forma_pagamento' => 'Cartão de Crédito',
            'status' => 'Concluída',
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
}
