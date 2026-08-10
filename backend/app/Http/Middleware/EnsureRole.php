<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            AuditLog::record(
                $user?->id,
                $user?->name ?? 'Desconhecido',
                'seguranca',
                "Acesso negado por permissão: {$request->method()} {$request->path()}",
                [
                    'role_atual' => $user?->role,
                    'roles_permitidos' => $roles,
                ]
            );

            return response()->json(['message' => 'Sem permissão para acessar este recurso.'], 403);
        }

        return $next($request);
    }
}
