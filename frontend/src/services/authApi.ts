import { apiRequest } from './apiClient';

export type AuthRole = 'admin' | 'manager' | 'employee' | 'finance';

export type AuthPermissions = {
  ver_leads?: boolean;
  editar_leads?: boolean;
  excluir_leads?: boolean;
  ver_financeiro?: boolean;
  criar_usuario?: boolean;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: AuthRole;
  status?: 'ativo' | 'inativo';
  setor?: string;
  permissions?: AuthPermissions | null;
  last_login_at?: string | null;
};

export type LoginResponse = {
  token: string;
  token_expires_at?: string | null;
  user: AuthUser;
};

export function getDefaultRouteForRole(role: AuthRole): string {
  return role === 'finance'
    ? '/crm/financeiro'
    : role === 'employee'
      ? '/crm/vendas'
      : '/crm';
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    errorMessage: 'Erro de autenticação',
    skipAuth: true,
  });
}

export async function me(token: string): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>('/auth/me', {
    token,
    errorMessage: 'Erro de autenticação',
  });
}

export async function logout(token: string): Promise<void> {
  await apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
    token,
    errorMessage: 'Erro ao sair',
  });
}
