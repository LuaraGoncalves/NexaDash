<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class LocalUserSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->users() as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }

    private function users(): array
    {
        return [
            [
                'name' => 'Administrador',
                'email' => 'admin@nexadash.local',
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
                'password' => 'password',
            ],
            [
                'name' => 'Gerente Comercial',
                'email' => 'gerente@nexadash.local',
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
                'password' => 'password',
            ],
            [
                'name' => 'Financeiro',
                'email' => 'financeiro@nexadash.local',
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
                'password' => 'password',
            ],
            [
                'name' => 'Caixa',
                'email' => 'caixa@nexadash.local',
                'role' => 'employee',
                'status' => 'ativo',
                'setor' => 'Vendas',
                'permissions' => [
                    'ver_leads' => true,
                    'editar_leads' => true,
                    'excluir_leads' => false,
                    'ver_financeiro' => false,
                    'criar_usuario' => false,
                ],
                'password' => 'password',
            ],
        ];
    }
}
