import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AttributeTemplateData,
  CreateAttributeTemplateData,
  UpdateAttributeTemplateData,
  UpsertAttributeTemplateValuesData,
} from '@/schemas/attribute-templates';

const BASE = 'commerce-api/le/attribute-templates';

// Fetches every attribute template this workspace can reach (reach-scoped via RLS)
export function getAttributeTemplates(search?: string): Promise<AttributeTemplateData[]> {
  return axios.get<AttributeTemplateData[]>(BASE, { params: search ? { search } : undefined }).then((r) => r.data);
}

// Creates an attribute template owned by this workspace
export function createAttributeTemplate(
  data: CreateAttributeTemplateData,
): Promise<CreateResponse<AttributeTemplateData>> {
  return axios.post<CreateResponse<AttributeTemplateData>>(BASE, data).then((r) => r.data);
}

// Updates an attribute template by ID
export function updateAttributeTemplate({
  id,
  data,
}: {
  id: string;
  data: UpdateAttributeTemplateData;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

// Activates or deactivates an attribute template
export function setAttributeTemplateActive({
  id,
  isActive,
}: {
  id: string;
  isActive: boolean;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/active`, { isActive }).then((r) => r.data);
}

// Deletes an attribute template by ID
export function deleteAttributeTemplate(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

// Replaces a template's values with the set supplied
export function upsertAttributeTemplateValues({
  templateId,
  values,
}: UpsertAttributeTemplateValuesData): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`${BASE}/${templateId}/values`, { values }).then((r) => r.data);
}
