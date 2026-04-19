import { api } from './api';

export type PieceItem = {
  id: string;
  code: string;
  description: string;
  category: string;
  karat: string;
  weight: number | null;
  metal_type: string;
};

export type WeightCategory = {
  id: string;
  name: string;
  code: string;
  metal_type: string;
  karat: string;
};

export async function fetchInvoiceFormData() {
  const { data } = await api.get<{
    success: boolean;
    data: { pieceItems: PieceItem[]; weightCategories: WeightCategory[] };
  }>('/inventory/invoice-form-data');
  return data.data;
}
