<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        $permissions = $user?->permissions ?? [];
        $hasPermission = $user?->role === 'admin' || (bool) ($permissions[$permission] ?? false);

        if (! $user || ! $hasPermission) {
            AuditLog::record(
                $user?->id,
                $user?->name ?? 'Desconhecido',
                'seguranca',
                "Acesso negado por permissão específica: {$permission}",
                [
                    'permission' => $permission,
                    'role_atual' => $user?->role,
                    'rota' => "{$request->method()} {$request->path()}",
                ]
            );

            return response()->json(['message' => 'Sem permissão para executar esta ação.'], 403);
        }

        return $next($request);
    }
}
