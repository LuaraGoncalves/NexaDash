<?php

namespace App\Http\Middleware;

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

        $user = User::where('api_token', $token)->first();

        if (! $user) {
            return response()->json(['message' => 'Token inválido.'], 401);
        }

        if (($user->status ?? 'ativo') !== 'ativo') {
            $user->forceFill([
                'api_token' => null,
            ])->save();

            return response()->json(['message' => 'Sua conta está inativa.'], 403);
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
