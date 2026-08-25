<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
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
        $user->refresh();

        $this->assertNotSame($token, $user->api_token);
        $this->assertSame(User::hashApiToken($token), $user->api_token);
        $this->assertNotNull($user->api_token_expires_at);

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
            'api_token' => User::hashApiToken('token-inativo'),
            'api_token_expires_at' => now()->addHour(),
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
            'api_token_expires_at' => null,
            'api_token_last_used_at' => null,
        ]);
    }

    public function test_expired_token_is_blocked_and_cleared(): void
    {
        $user = User::factory()->create([
            'role' => 'admin',
            'status' => 'ativo',
            'api_token' => User::hashApiToken('token-vencido'),
            'api_token_expires_at' => now()->subMinute(),
        ]);

        $this->getJson('/api/auth/me', [
            'Authorization' => 'Bearer token-vencido',
        ])
            ->assertUnauthorized()
            ->assertJson([
                'message' => 'Sessão expirada. Entre novamente.',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'api_token' => null,
            'api_token_expires_at' => null,
            'api_token_last_used_at' => null,
        ]);
    }

    public function test_login_is_rate_limited_after_invalid_attempts(): void
    {
        config()->set('auth.login_max_attempts', 2);
        config()->set('auth.login_decay_seconds', 60);

        $user = User::factory()->create([
            'email' => 'limite@nexadash.test',
            'password' => 'password',
            'role' => 'admin',
            'status' => 'ativo',
        ]);
        RateLimiter::clear("{$user->email}|127.0.0.1");

        $payload = [
            'email' => $user->email,
            'password' => 'senha-errada',
        ];

        $this->postJson('/api/auth/login', $payload)->assertUnauthorized();
        $this->postJson('/api/auth/login', $payload)->assertUnauthorized();

        $this->postJson('/api/auth/login', $payload)
            ->assertStatus(429)
            ->assertJsonStructure([
                'message',
                'retry_after_seconds',
            ]);
    }
}
