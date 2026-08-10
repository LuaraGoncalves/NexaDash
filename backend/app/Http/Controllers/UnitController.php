<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Unit;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UnitController extends Controller
{
    public function index()
    {
        return Unit::query()
            ->orderBy('sigla')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sigla' => ['required', 'string', 'max:10', 'unique:units,sigla'],
            'nome' => ['required', 'string', 'max:255'],
        ]);

        $unit = Unit::create($validated);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Unidade criada: {$unit->sigla}",
            ['unit_id' => $unit->id]
        );

        return $unit;
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'sigla' => ['sometimes', 'required', 'string', 'max:10', Rule::unique('units', 'sigla')->ignore($id)],
            'nome' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $unit = Unit::findOrFail($id);
        $unit->update($validated);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Unidade atualizada: {$unit->sigla}",
            ['unit_id' => $unit->id]
        );

        return $unit;
    }

    public function destroy(Request $request, string $id)
    {
        $unit = Unit::findOrFail($id);
        $unitSigla = $unit->sigla;
        $unitId = $unit->id;

        try {
            $unit->delete();
        } catch (QueryException) {
            return response()->json([
                'message' => 'Não foi possível excluir a unidade porque ela está vinculada a outros registros.',
            ], 409);
        }

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'produtos',
            "Unidade excluída: {$unitSigla}",
            ['unit_id' => $unitId]
        );

        return response()->json([
            'message' => 'Unidade excluída com sucesso.',
        ]);
    }
}
