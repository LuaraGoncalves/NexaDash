<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
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

        $token = Str::random(64);
        $user->forceFill([
            'api_token' => $token,
            'last_login_at' => now(),
        ])->save();

        AuditLog::record(
            $user->id,
            $user->name,
            'auth',
            'Login realizado com sucesso'
        );

        return response()->json([
            'token' => $token,
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
            $user->forceFill([
                'api_token' => null,
            ])->save();

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
}
