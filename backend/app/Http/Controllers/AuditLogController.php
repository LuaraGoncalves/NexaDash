<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'modulo' => ['nullable', 'string', 'max:255'],
            'usuario' => ['nullable', 'string', 'max:255'],
            'data_inicio' => ['nullable', 'date'],
            'data_fim' => ['nullable', 'date'],
        ]);

        return AuditLog::query()
            ->when(
                ! empty($validated['modulo']),
                fn ($query) => $query->where('modulo', $validated['modulo'])
            )
            ->when(
                ! empty($validated['usuario']),
                fn ($query) => $query->where('usuario_nome', 'like', '%'.$validated['usuario'].'%')
            )
            ->when(
                ! empty($validated['data_inicio']),
                fn ($query) => $query->whereDate('data_hora', '>=', $validated['data_inicio'])
            )
            ->when(
                ! empty($validated['data_fim']),
                fn ($query) => $query->whereDate('data_hora', '<=', $validated['data_fim'])
            )
            ->latest('data_hora')
            ->limit(100)
            ->get();
    }
}
