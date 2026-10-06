import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  AttributeTemplateData,
  CreateAttributeTemplateData,
  UpdateAttributeTemplateData,
  UpsertAttributeTemplateValuesData,
} from '@/schemas/attribute-templates';

// Structural rather than `typeof ORG_…`, so this folder carries no scope bias — the template surface
// is identical under org, le and site, and each scope's page passes its own code set.
export interface AttributeTemplatePermissions {
  view: string;
  add: string;
  edit: string;
  delete: string;
  toggle: string;
  values: { upsert: string };
}

// A dialog owns its own mutation because Form has no onSuccess — closing it on success has to be
// wired where the hook is called. So the scope's hook is handed over rather than its result.
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

// Everything this folder needs from a scope. Each scope's route builds one of these from its own
// hooks and permission codes; nothing under components/ may import a scoped hook directly, or the
// org endpoints get called from the le and site workspaces.
export interface AttributeTemplatesBinding {
  permissions: AttributeTemplatePermissions;
  useTemplates: UseAttributeTemplates;
  useCreate: UseCreateAttributeTemplate;
  useUpdate: UseUpdateAttributeTemplate;
  useUpsertValues: UseUpsertAttributeTemplateValues;
  useDelete: UseDeleteAttributeTemplate;
  useSetActive: UseSetAttributeTemplateActive;
}
