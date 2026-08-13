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
  user: AuthUser;
};

export function getDefaultRouteForRole(role: AuthRole): string {
  return role === 'finance'
    ? '/crm/financeiro'
    : role === 'employee'
      ? '/crm/vendas'
      : '/crm';
}

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro de autenticação');
  }

  return response.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse<LoginResponse>(response);
}

export async function me(token: string): Promise<{ user: AuthUser }> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse<{ user: AuthUser }>(response);
}

export async function logout(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro ao sair');
  }
}
