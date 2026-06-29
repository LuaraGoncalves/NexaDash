<?php

namespace App\Http\Controllers;

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

        $lead->update([
            'name' => $validated['name'] ?? $lead->name,
            'phone' => array_key_exists('phone', $validated) ? $validated['phone'] : $lead->phone,
            'email' => array_key_exists('email', $validated) ? $validated['email'] : $lead->email,
            'status' => $validated['status'] ?? $lead->status,
        ]);

        return $lead;
    }
}
