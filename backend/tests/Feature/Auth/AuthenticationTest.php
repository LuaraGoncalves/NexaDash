<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_active_user_can_login_and_fetch_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'admin@nexadash.test',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'ativo',
            'permissions' => [
                'ver_leads' => true,
                'editar_leads' => true,
                'excluir_leads' => true,
                'ver_financeiro' => true,
                'criar_usuario' => true,
            ],
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('user.email', $user->email)
            ->assertJsonPath('user.role', 'admin');

        $token = $loginResponse->json('token');

        $this->getJson('/api/auth/me', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'email' => 'inativo@nexadash.test',
            'password' => 'password',
            'role' => 'employee',
            'status' => 'inativo',
        ]);

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
            ->assertForbidden()
            ->assertJson([
                'message' => 'Esta conta está inativa e não pode entrar no sistema.',
            ]);
    }

    public function test_inactive_user_token_is_blocked_and_cleared(): void
    {
        $user = User::factory()->create([
            'role' => 'finance',
            'status' => 'inativo',
            'api_token' => 'token-inativo',
        ]);

        $this->getJson('/api/auth/me', [
            'Authorization' => 'Bearer token-inativo',
        ])
            ->assertForbidden()
            ->assertJson([
                'message' => 'Sua conta está inativa.',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'api_token' => null,
        ]);
    }
}
