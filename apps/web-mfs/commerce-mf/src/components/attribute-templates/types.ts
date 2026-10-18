import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AttributeTemplateData,
  CreateAttributeTemplateData,
  UpdateAttributeTemplateData,
  UpsertAttributeTemplateValuesData,
} from '@/schemas/attribute-templates';

export interface AttributeTemplatePermissions {
  view: string;
  add: string;
  edit: string;
  delete: string;
  toggle: string;
  values: { upsert: string };
}

type MutationHook<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

export type UseAttributeTemplates = (search?: string) => { data: AttributeTemplateData[] };
export type UseCreateAttributeTemplate = MutationHook<
  CreateResponse<AttributeTemplateData>,
  CreateAttributeTemplateData
>;
export type UseUpdateAttributeTemplate = MutationHook<
  SuccessResponse,
  { id: string; data: UpdateAttributeTemplateData }
>;
export type UseUpsertAttributeTemplateValues = MutationHook<SuccessResponse, UpsertAttributeTemplateValuesData>;
export type UseDeleteAttributeTemplate = MutationHook<SuccessResponse, string>;
export type UseSetAttributeTemplateActive = MutationHook<SuccessResponse, { id: string; isActive: boolean }>;

export interface AttributeTemplatesBinding {
  permissions: AttributeTemplatePermissions;
  useTemplates: UseAttributeTemplates;
  useCreate: UseCreateAttributeTemplate;
  useUpdate: UseUpdateAttributeTemplate;
  useUpsertValues: UseUpsertAttributeTemplateValues;
  useDelete: UseDeleteAttributeTemplate;
  useSetActive: UseSetAttributeTemplateActive;
}
