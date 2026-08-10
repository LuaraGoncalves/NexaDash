<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    public function index()
    {
        return Customer::query()
            ->latest('id')
            ->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['nullable', Rule::in(Customer::STATUS_OPTIONS)],
            'notes' => ['nullable', 'string'],
        ]);

        $customer = Customer::create([
            ...$validated,
            'status' => $validated['status'] ?? Customer::STATUS_ATIVO,
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'vendas',
            "Cliente criado: {$customer->name}",
            ['customer_id' => $customer->id]
        );

        return $customer;
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'status' => ['sometimes', 'required', Rule::in(Customer::STATUS_OPTIONS)],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $customer = Customer::findOrFail($id);
        $statusAnterior = $customer->status;
        $customer->update($validated);

        $acao = match (true) {
            $statusAnterior !== $customer->status && $customer->status === Customer::STATUS_INATIVO => "Cliente inativado: {$customer->name}",
            $statusAnterior !== $customer->status && $customer->status === Customer::STATUS_ATIVO => "Cliente reativado: {$customer->name}",
            default => "Cliente atualizado: {$customer->name}",
        };

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'vendas',
            $acao,
            ['customer_id' => $customer->id]
        );

        return $customer;
    }

    public function destroy(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);
        $customer->update([
            'status' => Customer::STATUS_INATIVO,
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'vendas',
            "Cliente inativado por exclusão lógica: {$customer->name}",
            ['customer_id' => $customer->id]
        );

        return response()->json([
            'message' => 'Cliente inativado com sucesso.',
            'customer' => $customer->fresh(),
        ]);
    }
}
