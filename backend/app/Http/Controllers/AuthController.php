<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);
        $rateLimitKey = $this->rateLimitKey($request, $validated['email']);

        if (RateLimiter::tooManyAttempts($rateLimitKey, $this->maxLoginAttempts())) {
            $seconds = RateLimiter::availableIn($rateLimitKey);

            AuditLog::record(
                null,
                $validated['email'],
                'auth',
                "Login bloqueado temporariamente por muitas tentativas: {$validated['email']}",
                [
                    'email' => $validated['email'],
                    'retry_after_seconds' => $seconds,
                ]
            );

            return response()->json([
                'message' => "Muitas tentativas de login. Tente novamente em {$seconds} segundos.",
                'retry_after_seconds' => $seconds,
            ], 429)->header('Retry-After', (string) $seconds);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($rateLimitKey, $this->loginDecaySeconds());

            AuditLog::record(
                $user?->id,
                $user?->name ?? $validated['email'],
                'auth',
                "Tentativa de login inválida: {$validated['email']}",
                ['email' => $validated['email']]
            );

            return response()->json([
                'message' => 'Email ou senha inválidos.',
            ], 401);
        }

        if (($user->status ?? 'ativo') !== 'ativo') {
            AuditLog::record(
                $user->id,
                $user->name,
                'auth',
                "Tentativa de login em conta inativa: {$user->email}",
                ['email' => $user->email]
            );

            return response()->json([
                'message' => 'Esta conta está inativa e não pode entrar no sistema.',
            ], 403);
        }

        RateLimiter::clear($rateLimitKey);
        $token = $user->issueApiToken();
        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        AuditLog::record(
            $user->id,
            $user->name,
            'auth',
            'Login realizado com sucesso',
            [
                'token_expires_at' => optional($user->api_token_expires_at)?->toDateTimeString(),
            ]
        );

        return response()->json([
            'token' => $token,
            'token_expires_at' => optional($user->api_token_expires_at)?->toDateTimeString(),
            'user' => $user->only(['id', 'name', 'email', 'role', 'status', 'setor', 'permissions', 'last_login_at']),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->only(['id', 'name', 'email', 'role', 'status', 'setor', 'permissions', 'last_login_at']),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $user->clearApiToken();

            AuditLog::record(
                $user->id,
                $user->name,
                'auth',
                'Logout realizado com sucesso'
            );
        }

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }

    private function rateLimitKey(Request $request, string $email): string
    {
        return Str::lower($email).'|'.$request->ip();
    }

    private function maxLoginAttempts(): int
    {
        return (int) config('auth.login_max_attempts', 5);
    }

    private function loginDecaySeconds(): int
    {
        return (int) config('auth.login_decay_seconds', 300);
    }
}
