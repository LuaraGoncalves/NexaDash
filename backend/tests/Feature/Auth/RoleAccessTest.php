<?php

namespace Tests\Feature\Auth;

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

    private function headersForRole(string $role): array
    {
        $token = Str::random(40);

        User::factory()->create([
            'role' => $role,
            'status' => 'ativo',
            'api_token' => $token,
            'permissions' => $this->permissionsForRole($role),
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
