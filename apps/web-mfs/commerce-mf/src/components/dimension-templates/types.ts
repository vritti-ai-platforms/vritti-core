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
