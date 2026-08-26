<?php

namespace Tests\Feature\Auth;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_can_access_sales_leads_and_products_but_not_financial_or_users(): void
    {
        $headers = $this->headersForRole('employee');

        $this->getJson('/api/crm/sales', $headers)->assertOk();
        $this->getJson('/api/crm/leads', $headers)->assertOk();
        $this->getJson('/api/crm/products', $headers)->assertOk();
        $this->getJson('/api/crm/financial/transactions', $headers)->assertForbidden();
        $this->getJson('/api/crm/users', $headers)->assertForbidden();
    }

    public function test_manager_can_access_catalog_and_dashboard_but_not_users(): void
    {
        $headers = $this->headersForRole('manager');

        $this->getJson('/api/crm/dashboard', $headers)->assertOk();
        $this->getJson('/api/crm/products', $headers)->assertOk();
        $this->getJson('/api/crm/users', $headers)->assertForbidden();
    }

    public function test_finance_can_access_financial_module_but_not_users(): void
    {
        $headers = $this->headersForRole('finance');

        $this->getJson('/api/crm/dashboard', $headers)->assertOk();
        $this->getJson('/api/crm/financial/transactions', $headers)->assertOk();
        $this->getJson('/api/crm/users', $headers)->assertForbidden();
    }

    public function test_employee_without_view_leads_permission_cannot_list_leads(): void
    {
        $headers = $this->headersForRole('employee', [
            'ver_leads' => false,
        ]);

        $this->getJson('/api/crm/leads', $headers)
            ->assertForbidden()
            ->assertJsonPath('message', 'Sem permissão para executar esta ação.');

        $this->assertDatabaseHas('audit_logs', [
            'modulo' => 'seguranca',
            'acao' => 'Acesso negado por permissão específica: ver_leads',
        ]);
    }

    public function test_manager_without_delete_leads_permission_cannot_delete_lead(): void
    {
        $lead = Lead::create([
            'name' => 'Lead Protegido',
            'status' => Lead::STATUS_NOVO,
        ]);
        $headers = $this->headersForRole('manager', [
            'excluir_leads' => false,
        ]);

        $this->deleteJson("/api/crm/leads/{$lead->id}", [], $headers)
            ->assertForbidden()
            ->assertJsonPath('message', 'Sem permissão para executar esta ação.');

        $this->assertDatabaseHas('leads', [
            'id' => $lead->id,
        ]);
        $this->assertDatabaseHas('audit_logs', [
            'modulo' => 'seguranca',
            'acao' => 'Acesso negado por permissão específica: excluir_leads',
        ]);
    }

    public function test_finance_without_financial_permission_cannot_access_financial_module(): void
    {
        $headers = $this->headersForRole('finance', [
            'ver_financeiro' => false,
        ]);

        $this->getJson('/api/crm/financial/transactions', $headers)
            ->assertForbidden()
            ->assertJsonPath('message', 'Sem permissão para executar esta ação.');

        $this->assertDatabaseHas('audit_logs', [
            'modulo' => 'seguranca',
            'acao' => 'Acesso negado por permissão específica: ver_financeiro',
        ]);
    }

    private function headersForRole(string $role, array $permissionOverrides = []): array
    {
        $token = Str::random(40);

        User::factory()->create([
            'role' => $role,
            'status' => 'ativo',
            'api_token' => User::hashApiToken($token),
            'api_token_expires_at' => now()->addHour(),
            'permissions' => array_merge($this->permissionsForRole($role), $permissionOverrides),
        ]);

        return [
            'Authorization' => "Bearer {$token}",
        ];
    }

    private function permissionsForRole(string $role): array
    {
        return match ($role) {
            'admin' => [
                'ver_leads' => true,
                'editar_leads' => true,
                'excluir_leads' => true,
                'ver_financeiro' => true,
                'criar_usuario' => true,
            ],
            'manager' => [
                'ver_leads' => true,
                'editar_leads' => true,
                'excluir_leads' => false,
                'ver_financeiro' => false,
                'criar_usuario' => false,
            ],
            'finance' => [
                'ver_leads' => false,
                'editar_leads' => false,
                'excluir_leads' => false,
                'ver_financeiro' => true,
                'criar_usuario' => false,
            ],
            default => [
                'ver_leads' => true,
                'editar_leads' => true,
                'excluir_leads' => false,
                'ver_financeiro' => false,
                'criar_usuario' => false,
            ],
        };
    }
}
