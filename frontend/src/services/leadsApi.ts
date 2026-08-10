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
    throw new Error(message || 'Erro ao comunicar com a API de leads');
  }

  return response.json() as Promise<T>;
}

export async function listLeads(): Promise<LeadRecord[]> {
  const response = await fetch(`${API_BASE}/crm/leads`, {
    headers: authHeaders(),
  });

  return handleResponse<LeadRecord[]>(response);
}

export async function updateLead(id: number, payload: LeadPayload): Promise<LeadRecord> {
  const response = await fetch(`${API_BASE}/crm/leads/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<LeadRecord>(response);
}

export async function deleteLead(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/crm/leads/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}

export async function listLeadMessages(id: number): Promise<LeadMessageRecord[]> {
  const response = await fetch(`${API_BASE}/crm/leads/${id}/messages`, {
    headers: authHeaders(),
  });

  return handleResponse<LeadMessageRecord[]>(response);
}

export async function createLeadMessage(
  id: number,
  payload: {
    sender_type?: LeadMessageSenderType;
    sender_name?: string;
    message: string;
  },
): Promise<LeadMessageRecord> {
  const response = await fetch(`${API_BASE}/crm/leads/${id}/messages`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<LeadMessageRecord>(response);
}
