import { apiRequest } from './apiClient';

export type SaleStatus = 'Aberta' | 'Concluída' | 'Cancelada';
export type SalePaymentMethod =
  | 'Dinheiro'
  | 'Cartão de Crédito'
  | 'Cartão de Débito'
  | 'PIX'
  | 'Boleto'
  | 'Múltiplo';

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
  status?: SaleStatus;
  itens: SaleItemPayload[];
};

export type SaleRecord = SalePayload & {
  id: number;
  protocolo: string | null;
};

export async function listSales(): Promise<SaleRecord[]> {
  return apiRequest<SaleRecord[]>('/crm/sales', {
    errorMessage: 'Erro ao comunicar com a API de vendas',
  });
}

export async function createSale(payload: SalePayload): Promise<SaleRecord> {
  return apiRequest<SaleRecord>('/crm/sales', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de vendas',
  });
}

export async function updateSaleStatus(id: number, status: SaleRecord['status']): Promise<SaleRecord> {
  return apiRequest<SaleRecord>(`/crm/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
    errorMessage: 'Erro ao comunicar com a API de vendas',
  });
}

export async function updateSale(id: number, payload: SalePayload): Promise<SaleRecord> {
  return apiRequest<SaleRecord>(`/crm/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de vendas',
  });
}

export async function deleteSale(id: number): Promise<{ message: string; sale: SaleRecord }> {
  return apiRequest<{ message: string; sale: SaleRecord }>(`/crm/sales/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de vendas',
  });
}
