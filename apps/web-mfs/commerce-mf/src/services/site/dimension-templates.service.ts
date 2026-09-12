import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  CreateDimensionTemplateData,
  DimensionTemplateData,
  UpdateDimensionTemplateData,
  UpsertDimensionTemplateValuesData,
} from '@/schemas/dimension-templates';

const BASE = 'commerce-api/site/dimension-templates';

// Fetches every dimension template this workspace can reach (reach-scoped via RLS)
export function getDimensionTemplates(search?: string): Promise<DimensionTemplateData[]> {
  return axios.get<DimensionTemplateData[]>(BASE, { params: search ? { search } : undefined }).then((r) => r.data);
}

// Creates a dimension template owned by this workspace
export function createDimensionTemplate(
  data: CreateDimensionTemplateData,
): Promise<CreateResponse<DimensionTemplateData>> {
  return axios.post<CreateResponse<DimensionTemplateData>>(BASE, data).then((r) => r.data);
}

// Updates a dimension template by ID
export function updateDimensionTemplate({
  id,
  data,
}: {
  id: string;
  data: UpdateDimensionTemplateData;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

// Activates or deactivates a dimension template
export function setDimensionTemplateActive({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/active`, { isActive }).then((r) => r.data);
}

// Deletes a dimension template by ID
export function deleteDimensionTemplate(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

// Replaces a template's values with the set supplied
export function upsertDimensionTemplateValues({
  templateId,
  values,
}: UpsertDimensionTemplateValuesData): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`${BASE}/${templateId}/values`, { values }).then((r) => r.data);
}
