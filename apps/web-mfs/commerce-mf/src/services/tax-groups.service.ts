import axios from '@vritti/quantum-ui/axios';

export interface TaxGroupData {
  id: string;
  name: string;
  rate: number;
  hsnSacCode: string | null;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

// Fetches all tax groups for a business unit
export function listTaxGroups(buId: string): Promise<TaxGroupData[]> {
  return axios
    .get<TaxGroupData[]>('commerce-api/tax-groups', { params: { buId } })
    .then((r) => r.data);
}
