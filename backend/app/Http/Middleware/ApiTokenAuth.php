<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json(['message' => 'Não autenticado.'], 401);
        }

        $user = User::where('api_token', User::hashApiToken($token))->first();

        if (! $user) {
            return response()->json(['message' => 'Token inválido.'], 401);
        }

        if ($user->apiTokenExpired()) {
            $user->clearApiToken();

            AuditLog::record(
                $user->id,
                $user->name,
                'auth',
                'Sessão expirada por token vencido'
            );

            return response()->json(['message' => 'Sessão expirada. Entre novamente.'], 401);
        }

        if (($user->status ?? 'ativo') !== 'ativo') {
            $user->clearApiToken();

            return response()->json(['message' => 'Sua conta está inativa.'], 403);
        }

        $user->markApiTokenUsed();
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
