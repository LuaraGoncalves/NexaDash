<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    public function index()
    {
        return User::query()
            ->latest('id')
            ->get()
            ->map(fn (User $user) => $this->formatUser($user));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in(array_keys($this->roleLabels()))],
            'status' => ['nullable', Rule::in(['ativo', 'inativo'])],
            'setor' => ['nullable', 'string', 'max:255'],
            'permissions' => ['nullable', 'array'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'status' => $validated['status'] ?? 'ativo',
            'setor' => $validated['setor'] ?? 'Geral',
            'permissions' => $validated['permissions'] ?? $this->defaultPermissionsForRole($validated['role']),
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'usuarios',
            "Usuário criado: {$user->name}",
            ['user_id' => $user->id]
        );

        return $this->formatUser($user);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
            'role' => ['sometimes', 'required', Rule::in(array_keys($this->roleLabels()))],
            'status' => ['sometimes', 'required', Rule::in(['ativo', 'inativo'])],
            'setor' => ['sometimes', 'nullable', 'string', 'max:255'],
            'permissions' => ['sometimes', 'nullable', 'array'],
        ]);

        $user = User::findOrFail($id);
        $statusAnterior = $user->status;
        $payload = collect($validated)
            ->reject(fn ($value, $key) => $key === 'password' && $value === null)
            ->all();

        if (isset($payload['role']) && ! array_key_exists('permissions', $payload)) {
            $payload['permissions'] = $this->defaultPermissionsForRole($payload['role']);
        }

        $user->update($payload);

        $acao = match (true) {
            $statusAnterior !== $user->status && $user->status === 'inativo' => "Usuário inativado: {$user->name}",
            $statusAnterior !== $user->status && $user->status === 'ativo' => "Usuário reativado: {$user->name}",
            default => "Usuário atualizado: {$user->name}",
        };

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'usuarios',
            $acao,
            ['user_id' => $user->id]
        );

        return $this->formatUser($user->fresh());
    }

    public function destroy(Request $request, string $id)
    {
        $user = User::findOrFail($id);
        $user->update([
            'status' => 'inativo',
        ]);

        AuditLog::record(
            $request->user()?->id,
            $request->user()?->name ?? 'Sistema',
            'usuarios',
            "Usuário inativado por exclusão lógica: {$user->name}",
            ['user_id' => $user->id]
        );

        return response()->json([
            'message' => 'Usuário inativado com sucesso.',
            'user' => $this->formatUser($user->fresh()),
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'nome' => $user->name,
            'email' => $user->email,
            'status' => $user->status ?? 'ativo',
            'role' => $user->role,
            'perfil' => $this->roleLabels()[$user->role] ?? $user->role,
            'setor' => $user->setor ?? 'Geral',
            'data_criacao' => optional($user->created_at)?->format('Y-m-d'),
            'ultimo_acesso' => optional($user->last_login_at)?->format('Y-m-d H:i'),
            'permissoes' => $user->permissions ?? $this->defaultPermissionsForRole($user->role),
        ];
    }

    private function roleLabels(): array
    {
        return [
            'admin' => 'Administrador',
            'manager' => 'Gerente de Vendas',
            'employee' => 'Atendente',
            'finance' => 'Financeiro',
        ];
    }

    private function defaultPermissionsForRole(string $role): array
    {
        return match ($role) {
            'admin' => [
                'ver_leads' => true,
                'editar_leads' => true,
                'excluir_leads' => true,
                'ver_financeiro' => true,
                'criar_usuario' => true,
            ],
            'manager' => [
                'ver_leads' => true,
                'editar_leads' => true,
                'excluir_leads' => false,
                'ver_financeiro' => false,
                'criar_usuario' => false,
            ],
            'finance' => [
                'ver_leads' => false,
                'editar_leads' => false,
                'excluir_leads' => false,
                'ver_financeiro' => true,
                'criar_usuario' => false,
            ],
            default => [
                'ver_leads' => true,
                'editar_leads' => false,
                'excluir_leads' => false,
                'ver_financeiro' => false,
                'criar_usuario' => false,
            ],
        };
    }
}
