import { apiRequest } from './apiClient';

export type LeadStatus = 'novo' | 'negociacao' | 'indeciso' | 'aguardando' | 'concluido';

export type LeadRecord = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  status: LeadStatus;
};

export type LeadPayload = {
  name?: string;
  phone?: string | null;
  email?: string | null;
  status?: LeadStatus;
};

export type LeadMessageSenderType = 'team' | 'customer' | 'system';

export type LeadMessageRecord = {
  id: number;
  lead_id: number;
  user_id: number | null;
  sender_type: LeadMessageSenderType;
  sender_name: string;
  message: string;
  sent_at: string;
};

export async function listLeads(): Promise<LeadRecord[]> {
  return apiRequest<LeadRecord[]>('/crm/leads', {
    errorMessage: 'Erro ao comunicar com a API de leads',
  });
}

export async function createLead(payload: Required<Pick<LeadPayload, 'name'>> & LeadPayload): Promise<LeadRecord> {
  return apiRequest<LeadRecord>('/crm/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de leads',
  });
}

export async function updateLead(id: number, payload: LeadPayload): Promise<LeadRecord> {
  return apiRequest<LeadRecord>(`/crm/leads/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de leads',
  });
}

export async function deleteLead(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/crm/leads/${id}`, {
    method: 'DELETE',
    errorMessage: 'Erro ao comunicar com a API de leads',
  });
}

export async function listLeadMessages(id: number): Promise<LeadMessageRecord[]> {
  return apiRequest<LeadMessageRecord[]>(`/crm/leads/${id}/messages`, {
    errorMessage: 'Erro ao comunicar com a API de leads',
  });
}

export async function createLeadMessage(
  id: number,
  payload: {
    sender_type?: LeadMessageSenderType;
    sender_name?: string;
    message: string;
  },
): Promise<LeadMessageRecord> {
  return apiRequest<LeadMessageRecord>(`/crm/leads/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(payload),
    errorMessage: 'Erro ao comunicar com a API de leads',
  });
}
