import { apiRequest } from './apiClient';

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

export async function listFinancialTransactions(): Promise<FinancialTransactionRecord[]> {
  return apiRequest<FinancialTransactionRecord[]>('/crm/financial/transactions', {
    errorMessage: 'Erro ao comunicar com a API financeira',
  });
}

export async function listFinancialCategories(): Promise<FinancialCategoryRecord[]> {
  return apiRequest<FinancialCategoryRecord[]>('/crm/financial/categories', {
    errorMessage: 'Erro ao comunicar com a API financeira',
  });
}

export async function createFinancialTransaction(
  payload: FinancialTransactionPayload,
): Promise<FinancialTransactionRecord> {
  return apiRequest<FinancialTransactionRecord>('/crm/financial/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API financeira',
  });
}

export async function updateFinancialTransaction(
  id: number,
  payload: Partial<FinancialTransactionPayload>,
): Promise<FinancialTransactionRecord> {
  return apiRequest<FinancialTransactionRecord>(`/crm/financial/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API financeira',
  });
}

export async function createFinancialCategory(
  payload: FinancialCategoryPayload,
): Promise<FinancialCategoryRecord> {
  return apiRequest<FinancialCategoryRecord>('/crm/financial/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API financeira',
  });
}

export async function updateFinancialCategory(
  id: number,
  payload: Partial<FinancialCategoryPayload>,
): Promise<FinancialCategoryRecord> {
  return apiRequest<FinancialCategoryRecord>(`/crm/financial/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API financeira',
  });
}

export async function deleteFinancialTransaction(
  id: number,
): Promise<{ message: string; transaction: FinancialTransactionRecord }> {
  return apiRequest<{ message: string; transaction: FinancialTransactionRecord }>(`/crm/financial/transactions/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API financeira',
  });
}

export async function deleteFinancialCategory(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/crm/financial/categories/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API financeira',
  });
}
