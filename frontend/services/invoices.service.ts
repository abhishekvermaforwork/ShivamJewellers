import { api, getApiErrorMessage } from './api';

export async function fetchInvoices(params?: { q?: string; date?: string; page?: number }) {
  const { data } = await api.get<{ success: boolean; data: { items: unknown[]; total: number } }>(
    '/invoices',
    { params },
  );
  return data.data;
}

export type InvoicePayload = Record<string, unknown>;

export async function createInvoice(body: InvoicePayload) {
  try {
    const { data } = await api.post<{ success: boolean; data: unknown }>('/invoices', body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function updateInvoice(id: string, body: InvoicePayload) {
  try {
    const { data } = await api.put<{ success: boolean; data: unknown }>(`/invoices/${id}`, body);
    return data.data;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function fetchInvoice(id: string) {
  const { data } = await api.get<{ success: boolean; data: { invoice: Record<string, unknown>; lineItems: unknown[] } }>(
    `/invoices/${id}`,
  );
  return data.data;
}

export async function downloadInvoicePdf(id: string, filename: string) {
  try {
    const { data } = await api.get<Blob>(`/invoices/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}
