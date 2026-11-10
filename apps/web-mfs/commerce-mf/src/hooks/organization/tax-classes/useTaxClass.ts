import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { TaxClassData } from '@/schemas/tax-classes';
import { getTaxClass } from '@/services/organization/tax-classes.service';
import { TAX_CLASS_KEY } from './keys';

// Fetches one tax class for its detail page, suspending until it arrives
export function useTaxClass(id: string) {
  return useSuspenseQuery<TaxClassData, AxiosError>({
    queryKey: TAX_CLASS_KEY(id),
    queryFn: () => getTaxClass(id),
  });
}
