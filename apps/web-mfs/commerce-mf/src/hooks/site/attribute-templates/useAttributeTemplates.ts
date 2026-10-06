import { type UseSuspenseQueryOptions, useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { AttributeTemplateData } from '@/schemas/attribute-templates';
import { getAttributeTemplates } from '@/services/site/attribute-templates.service';
import { ATTRIBUTE_TEMPLATES_KEY } from './keys';

type Options = Omit<UseSuspenseQueryOptions<AttributeTemplateData[], AxiosError>, 'queryKey' | 'queryFn'>;

// Fetches every attribute template this workspace can reach
export function useAttributeTemplates(search?: string, options?: Options) {
  return useSuspenseQuery<AttributeTemplateData[], AxiosError>({
    queryKey: [...ATTRIBUTE_TEMPLATES_KEY, { search }],
    queryFn: () => getAttributeTemplates(search),
    ...options,
  });
}
