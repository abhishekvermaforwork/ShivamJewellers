import { api } from './api';

export type DashboardData = {
  revenueThisMonth: number;
  totalOutstanding: number;
  totalOverdue: number;
  outstandingClients: { name: string; amount: number }[];
  overdueClients: { name: string; amount: number }[];
  revenueClients: { name: string; amount: number }[];
  clientTotals: { name: string; total: number }[];
  recentInvoices: Record<string, unknown>[];
};

export async function fetchDashboard(): Promise<DashboardData> {
  const { data } = await api.get<{ success: boolean; data: DashboardData }>('/dashboard');
  return data.data;
}
