export type SaleItemPayload = {
  id_produto: number;
  nome: string;
  preco_unitario: number;
  quantidade: number;
  subtotal: number;
};

export type SalePayload = {
  id_cliente?: number;
  cliente_nome: string;
  data_hora: string;
  total: number;
  forma_pagamento: string;
  status?: 'Aberta' | 'Concluída' | 'Cancelada';
  itens: SaleItemPayload[];
};

export type SaleRecord = SalePayload & {
  id: number;
  protocolo: string | null;
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
    throw new Error(message || 'Erro ao comunicar com a API de vendas');
  }

  return response.json() as Promise<T>;
}

export async function listSales(): Promise<SaleRecord[]> {
  const response = await fetch(`${API_BASE}/crm/sales`, {
    headers: authHeaders(),
  });
  return handleResponse<SaleRecord[]>(response);
}

export async function createSale(payload: SalePayload): Promise<SaleRecord> {
  const response = await fetch(`${API_BASE}/crm/sales`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<SaleRecord>(response);
}

export async function updateSaleStatus(id: number, status: SaleRecord['status']): Promise<SaleRecord> {
  const response = await fetch(`${API_BASE}/crm/sales/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });

  return handleResponse<SaleRecord>(response);
}

export async function deleteSale(id: number): Promise<{ message: string; sale: SaleRecord }> {
  const response = await fetch(`${API_BASE}/crm/sales/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string; sale: SaleRecord }>(response);
}
