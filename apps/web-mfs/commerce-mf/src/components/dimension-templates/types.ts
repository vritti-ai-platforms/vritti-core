import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  CreateDimensionTemplateData,
  DimensionTemplateData,
  UpdateDimensionTemplateData,
  UpsertDimensionTemplateValuesData,
} from '@/schemas/dimension-templates';

// Structural rather than `typeof ORG_…`, so this folder carries no scope bias — the template surface
// is identical under org, le and site, and each scope's page passes its own code set.
export interface DimensionTemplatePermissions {
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

export type UseDimensionTemplates = (search?: string) => { data: DimensionTemplateData[] };
export type UseCreateDimensionTemplate = MutationHook<
  CreateResponse<DimensionTemplateData>,
  CreateDimensionTemplateData
>;
export type UseUpdateDimensionTemplate = MutationHook<
  SuccessResponse,
  { id: string; data: UpdateDimensionTemplateData }
>;
export type UseUpsertDimensionTemplateValues = MutationHook<SuccessResponse, UpsertDimensionTemplateValuesData>;
export type UseDeleteDimensionTemplate = MutationHook<SuccessResponse, string>;
export type UseSetDimensionTemplateActive = MutationHook<SuccessResponse, { id: string; isActive: boolean }>;

// Everything this folder needs from a scope. Each scope's route builds one of these from its own
// hooks and permission codes; nothing under components/ may import a scoped hook directly, or the
// org endpoints get called from the le and site workspaces.
export interface DimensionTemplatesBinding {
  permissions: DimensionTemplatePermissions;
  useTemplates: UseDimensionTemplates;
  useCreate: UseCreateDimensionTemplate;
  useUpdate: UseUpdateDimensionTemplate;
  useUpsertValues: UseUpsertDimensionTemplateValues;
  useDelete: UseDeleteDimensionTemplate;
  useSetActive: UseSetDimensionTemplateActive;
}
