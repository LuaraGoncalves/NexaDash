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
}
