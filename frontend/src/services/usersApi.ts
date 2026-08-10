export type UserRole = 'admin' | 'manager' | 'employee' | 'finance';
export type UserStatus = 'ativo' | 'inativo';
export type PermissionKey =
  | 'ver_leads'
  | 'editar_leads'
  | 'excluir_leads'
  | 'ver_financeiro'
  | 'criar_usuario';

export type UserPermissions = Record<PermissionKey, boolean>;

export type ManagedUser = {
  id: number;
  nome: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  perfil: string;
  setor: string;
  data_criacao: string;
  ultimo_acesso: string | null;
  permissoes: UserPermissions;
};

export type ManagedUserPayload = {
  name: string;
  email: string;
  password?: string | null;
  role: UserRole;
  status: UserStatus;
  setor: string;
  permissions: UserPermissions;
};

export type AuditLogRecord = {
  id: number;
  user_id: number | null;
  usuario_nome: string;
  modulo: string;
  acao: string;
  data_hora: string;
  metadata?: Record<string, unknown> | null;
};

export type AuditLogFilters = {
  modulo?: string;
  usuario?: string;
  data_inicio?: string;
  data_fim?: string;
};

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';
const TOKEN_KEY = 'nexadash_token';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);

  return token
    ? {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro ao comunicar com a API de usuários');
  }

  return response.json() as Promise<T>;
}

export async function listUsers(): Promise<ManagedUser[]> {
  const response = await fetch(`${API_BASE}/crm/users`, {
    headers: authHeaders(),
  });

  return handleResponse<ManagedUser[]>(response);
}

export async function createManagedUser(payload: ManagedUserPayload): Promise<ManagedUser> {
  const response = await fetch(`${API_BASE}/crm/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ManagedUser>(response);
}

export async function updateManagedUser(id: number, payload: Partial<ManagedUserPayload>): Promise<ManagedUser> {
  const response = await fetch(`${API_BASE}/crm/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ManagedUser>(response);
}

export async function deleteManagedUser(id: number): Promise<{ message: string; user: ManagedUser }> {
  const response = await fetch(`${API_BASE}/crm/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string; user: ManagedUser }>(response);
}

export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogRecord[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  const response = await fetch(`${API_BASE}/crm/audit-logs${queryString ? `?${queryString}` : ''}`, {
    headers: authHeaders(),
  });

  return handleResponse<AuditLogRecord[]>(response);
}
