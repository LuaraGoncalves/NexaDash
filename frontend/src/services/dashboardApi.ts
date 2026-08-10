export type DashboardOverviewPoint = {
  label: string;
  value: number;
};

export type DashboardTeamPerformance = {
  name: string;
  val: number;
};

export type DashboardActivity = {
  id: number;
  text: string;
  time: string;
  type: string;
};

export type DashboardData = {
  sales: {
    total_revenue: number;
    completed_count: number;
    monthly_overview: DashboardOverviewPoint[];
  };
  products: {
    total: number;
    low_stock: number;
  };
  leads: {
    new_leads: number;
    conversion_rate: number;
    total: number;
  };
  financial: {
    revenue: number;
    expenses: number;
    balance: number;
  };
  users: {
    active: number;
  };
  team_performance: DashboardTeamPerformance[];
  recent_activities: DashboardActivity[];
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
    throw new Error(message || 'Erro ao comunicar com a API do dashboard');
  }

  return response.json() as Promise<T>;
}

export async function getDashboardData(): Promise<DashboardData> {
  const response = await fetch(`${API_BASE}/crm/dashboard`, {
    headers: authHeaders(),
  });

  return handleResponse<DashboardData>(response);
}
