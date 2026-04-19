import { api } from './api';

export type SalesReport = {
  todayGold: number;
  todaySilver: number;
  monthGold: number;
  monthSilver: number;
  hasRange: boolean;
  rangeGold: number | null;
  rangeSilver: number | null;
  dateFrom: string;
  dateTo: string;
  rangeInvoices: Record<string, unknown>[];
};

export async function fetchSalesReport(params?: { dateFrom?: string; dateTo?: string }) {
  const { data } = await api.get<{ success: boolean; data: SalesReport }>('/sales/report', { params });
  return data.data;
}
