import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type {
  CreateDimensionTemplateData,
  DimensionTemplateData,
  UpdateDimensionTemplateData,
  UpsertDimensionTemplateValuesData,
} from '@/schemas/dimension-templates';

export interface DimensionTemplatePermissions {
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

export interface DimensionTemplatesBinding {
  permissions: DimensionTemplatePermissions;
  useTemplates: UseDimensionTemplates;
  useCreate: UseCreateDimensionTemplate;
  useUpdate: UseUpdateDimensionTemplate;
  useUpsertValues: UseUpsertDimensionTemplateValues;
  useDelete: UseDeleteDimensionTemplate;
  useSetActive: UseSetDimensionTemplateActive;
}
