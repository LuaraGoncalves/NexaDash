import { apiRequest } from './apiClient';

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

export async function getDashboardData(): Promise<DashboardData> {
  return apiRequest<DashboardData>('/crm/dashboard', {
    errorMessage: 'Erro ao comunicar com a API do dashboard',
  });
}
