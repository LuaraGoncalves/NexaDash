export type CustomerStatus = 'ativo' | 'inativo';

export type CustomerRecord = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  status: CustomerStatus;
  notes?: string | null;
};

export type CustomerPayload = {
  name: string;
  phone?: string | null;
  email?: string | null;
  status?: CustomerStatus;
  notes?: string | null;
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
    throw new Error(message || 'Erro ao comunicar com a API de clientes');
  }

  return response.json() as Promise<T>;
}

export async function listCustomers(): Promise<CustomerRecord[]> {
  const response = await fetch(`${API_BASE}/crm/customers`, {
    headers: authHeaders(),
  });

  return handleResponse<CustomerRecord[]>(response);
}

export async function createCustomer(payload: CustomerPayload): Promise<CustomerRecord> {
  const response = await fetch(`${API_BASE}/crm/customers`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<CustomerRecord>(response);
}

export async function updateCustomer(id: number, payload: Partial<CustomerPayload>): Promise<CustomerRecord> {
  const response = await fetch(`${API_BASE}/crm/customers/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<CustomerRecord>(response);
}

export async function deleteCustomer(id: number): Promise<{ message: string; customer: CustomerRecord }> {
  const response = await fetch(`${API_BASE}/crm/customers/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string; customer: CustomerRecord }>(response);
}
