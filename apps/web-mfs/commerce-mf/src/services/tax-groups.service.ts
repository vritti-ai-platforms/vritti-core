import axios from '@vritti/quantum-ui/axios';

export interface TaxRateData {
  id: string;
  name: string;
  rate: string;
  type: 'inclusive' | 'exclusive';
  sortOrder: number;
}

export interface TaxGroupData {
  id: string;
  name: string;
  taxRates: TaxRateData[];
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
