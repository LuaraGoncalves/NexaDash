import { apiRequest } from './apiClient';

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

export async function listUsers(): Promise<ManagedUser[]> {
  return apiRequest<ManagedUser[]>('/crm/users', {
    errorMessage: 'Erro ao comunicar com a API de usuários',
  });
}

export async function createManagedUser(payload: ManagedUserPayload): Promise<ManagedUser> {
  return apiRequest<ManagedUser>('/crm/users', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de usuários',
  });
}

export async function updateManagedUser(id: number, payload: Partial<ManagedUserPayload>): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/crm/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de usuários',
  });
}

export async function deleteManagedUser(id: number): Promise<{ message: string; user: ManagedUser }> {
  return apiRequest<{ message: string; user: ManagedUser }>(`/crm/users/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de usuários',
  });
}

export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogRecord[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return apiRequest<AuditLogRecord[]>(`/crm/audit-logs${queryString ? `?${queryString}` : ''}`, {
    errorMessage: 'Erro ao comunicar com a API de usuários',
  });
}
