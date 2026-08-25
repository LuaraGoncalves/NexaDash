import { apiRequest } from './apiClient';

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

export async function listCustomers(): Promise<CustomerRecord[]> {
  return apiRequest<CustomerRecord[]>('/crm/customers', {
    errorMessage: 'Erro ao comunicar com a API de clientes',
  });
}

export async function createCustomer(payload: CustomerPayload): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>('/crm/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de clientes',
  });
}

export async function updateCustomer(id: number, payload: Partial<CustomerPayload>): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>(`/crm/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de clientes',
  });
}

export async function deleteCustomer(id: number): Promise<{ message: string; customer: CustomerRecord }> {
  return apiRequest<{ message: string; customer: CustomerRecord }>(`/crm/customers/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de clientes',
  });
}
