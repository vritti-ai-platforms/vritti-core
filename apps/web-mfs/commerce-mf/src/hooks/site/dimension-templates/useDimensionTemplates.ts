import { type UseSuspenseQueryOptions, useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { DimensionTemplateData } from '@/schemas/dimension-templates';
import { getDimensionTemplates } from '@/services/site/dimension-templates.service';
import { DIMENSION_TEMPLATES_KEY } from './keys';

type Options = Omit<UseSuspenseQueryOptions<DimensionTemplateData[], AxiosError>, 'queryKey' | 'queryFn'>;

// Fetches every dimension template this workspace can reach
export function useDimensionTemplates(search?: string, options?: Options) {
  return useSuspenseQuery<DimensionTemplateData[], AxiosError>({
    queryKey: [...DIMENSION_TEMPLATES_KEY, { search }],
    queryFn: () => getDimensionTemplates(search),
    ...options,
  });
}
