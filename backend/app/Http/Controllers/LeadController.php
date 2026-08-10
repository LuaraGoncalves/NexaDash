<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function index()
    {
        return Lead::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', Rule::in(Lead::STATUS_OPTIONS)],
        ]);

        $lead = Lead::create([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'status' => $validated['status'] ?? Lead::STATUS_NOVO,
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'leads',
            "Lead criado: {$lead->name}",
            ['lead_id' => $lead->id]
        );

        return $lead;
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'status' => ['sometimes', 'required', Rule::in(Lead::STATUS_OPTIONS)],
        ]);

        $lead = Lead::findOrFail($id);

        $statusAnterior = $lead->status;

        $lead->update([
            'name' => $validated['name'] ?? $lead->name,
            'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $lead->phone,
            'email' => array_key_exists('email', $validated) ? $validated['email'] : $lead->email,
            'status' => $validated['status'] ?? $lead->status,
        ]);

        $acao = $statusAnterior !== $lead->status
            ? "Lead atualizado: {$lead->name} ({$statusAnterior} -> {$lead->status})"
            : "Lead atualizado: {$lead->name}";

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'leads',
            $acao,
            ['lead_id' => $lead->id, 'status' => $lead->status]
        );

        return $lead;
    }

    public function destroy(Request $request, string $id)
    {
        $lead = Lead::findOrFail($id);
        $leadName = $lead->name;
        $leadId = $lead->id;
        $lead->delete();

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'leads',
            "Lead excluído: {$leadName}",
            ['lead_id' => $leadId]
        );

        return response()->json([
            'message' => 'Lead excluído com sucesso.',
        ]);
    }
}
