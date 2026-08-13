export type FinancialTransactionType = 'receita' | 'despesa';
export type FinancialTransactionStatus = 'Pago' | 'Pendente' | 'Cancelado';
export type FinancialCategoryType = 'receita' | 'despesa' | 'ambos';

export type FinancialCategoryRecord = {
  id: number;
  nome: string;
  tipo: FinancialCategoryType;
  cor: string;
};

export type FinancialCategoryPayload = {
  nome: string;
  tipo: FinancialCategoryType;
  cor?: string | null;
};

export type FinancialTransactionRecord = {
  id: number;
  tipo: FinancialTransactionType;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string | null;
  id_categoria: number;
  forma_pagamento: string;
  status: FinancialTransactionStatus;
  protocolo_venda?: string | null;
  observacoes?: string | null;
  categoria?: FinancialCategoryRecord | null;
};

export type FinancialTransactionPayload = {
  tipo: FinancialTransactionType;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string | null;
  id_categoria?: number | null;
  forma_pagamento: string;
  status?: FinancialTransactionStatus;
  protocolo_venda?: string | null;
  observacoes?: string | null;
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
    throw new Error(message || 'Erro ao comunicar com a API financeira');
  }

  return response.json() as Promise<T>;
}

export async function listFinancialTransactions(): Promise<FinancialTransactionRecord[]> {
  const response = await fetch(`${API_BASE}/crm/financial/transactions`, {
    headers: authHeaders(),
  });

  return handleResponse<FinancialTransactionRecord[]>(response);
}

export async function listFinancialCategories(): Promise<FinancialCategoryRecord[]> {
  const response = await fetch(`${API_BASE}/crm/financial/categories`, {
    headers: authHeaders(),
  });

  return handleResponse<FinancialCategoryRecord[]>(response);
}

export async function createFinancialTransaction(
  payload: FinancialTransactionPayload,
): Promise<FinancialTransactionRecord> {
  const response = await fetch(`${API_BASE}/crm/financial/transactions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<FinancialTransactionRecord>(response);
}

export async function updateFinancialTransaction(
  id: number,
  payload: Partial<FinancialTransactionPayload>,
): Promise<FinancialTransactionRecord> {
  const response = await fetch(`${API_BASE}/crm/financial/transactions/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<FinancialTransactionRecord>(response);
}

export async function createFinancialCategory(
  payload: FinancialCategoryPayload,
): Promise<FinancialCategoryRecord> {
  const response = await fetch(`${API_BASE}/crm/financial/categories`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<FinancialCategoryRecord>(response);
}

export async function updateFinancialCategory(
  id: number,
  payload: Partial<FinancialCategoryPayload>,
): Promise<FinancialCategoryRecord> {
  const response = await fetch(`${API_BASE}/crm/financial/categories/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<FinancialCategoryRecord>(response);
}

export async function deleteFinancialTransaction(
  id: number,
): Promise<{ message: string; transaction: FinancialTransactionRecord }> {
  const response = await fetch(`${API_BASE}/crm/financial/transactions/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string; transaction: FinancialTransactionRecord }>(response);
}

export async function deleteFinancialCategory(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/crm/financial/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}
