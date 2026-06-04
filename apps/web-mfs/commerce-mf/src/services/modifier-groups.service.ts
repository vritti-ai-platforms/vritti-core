import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { ModifierGroupDetail } from '@/schemas/modifiers';
import type { ModifierGroupData, ModifierOptionData } from '@/schemas/offerings';

// Lists all modifier groups for a catalog
export function listModifierGroups(catalogId: string): Promise<ModifierGroupData[]> {
  return axios
    .get<ModifierGroupData[]>(`commerce-api/catalogs/${catalogId}/modifiers`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches a single modifier group with its options
export function getModifierGroup({
  catalogId,
  groupId,
}: {
  catalogId: string;
  groupId: string;
}): Promise<ModifierGroupDetail> {
  return axios
    .get<ModifierGroupDetail>(`commerce-api/catalogs/${catalogId}/modifiers/${groupId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export interface CreateModifierGroupPayload {
  catalogId: string;
  data: {
    name: string;
    selectionType: 'SINGLE' | 'MULTI';
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
    isActive?: boolean;
  };
}

// Creates a new modifier group within a catalog
export function createModifierGroup({ catalogId, data }: CreateModifierGroupPayload): Promise<ModifierGroupData> {
  return axios.post<ModifierGroupData>(`commerce-api/catalogs/${catalogId}/modifiers`, data).then((r) => r.data);
}

export interface UpdateModifierGroupPayload {
  catalogId: string;
  groupId: string;
  data: {
    name?: string;
    selectionType?: 'SINGLE' | 'MULTI';
    minSelections?: number;
    maxSelections?: number | null;
    sortOrder?: number;
    isActive?: boolean;
  };
}

// Updates a modifier group by ID
export function updateModifierGroup({
  catalogId,
  groupId,
  data,
}: UpdateModifierGroupPayload): Promise<ModifierGroupData> {
  return axios
    .patch<ModifierGroupData>(`commerce-api/catalogs/${catalogId}/modifiers/${groupId}`, data)
    .then((r) => r.data);
}

// Deletes a modifier group by ID
export function deleteModifierGroup({
  catalogId,
  groupId,
}: {
  catalogId: string;
  groupId: string;
}): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/catalogs/${catalogId}/modifiers/${groupId}`).then((r) => r.data);
}

export interface CreateModifierOptionPayload {
  catalogId: string;
  groupId: string;
  data: {
    name: string;
    additionalPrice: number;
    sortOrder?: number;
  };
}

// Adds an option to a modifier group
export function createModifierOption({
  catalogId,
  groupId,
  data,
}: CreateModifierOptionPayload): Promise<ModifierOptionData> {
  return axios
    .post<ModifierOptionData>(`commerce-api/catalogs/${catalogId}/modifiers/${groupId}/options`, data)
    .then((r) => r.data);
}

export interface DeleteModifierOptionPayload {
  catalogId: string;
  groupId: string;
  optionId: string;
}

export interface UpdateModifierOptionPayload {
  catalogId: string;
  groupId: string;
  optionId: string;
  data: { name?: string; additionalPrice?: number; isDefault?: boolean; isAvailable?: boolean };
}

// Updates a modifier option's properties
export function updateModifierOption({
  catalogId,
  groupId,
  optionId,
  data,
}: UpdateModifierOptionPayload): Promise<ModifierOptionData> {
  return axios
    .patch<ModifierOptionData>(`commerce-api/catalogs/${catalogId}/modifiers/${groupId}/options/${optionId}`, data)
    .then((r) => r.data);
}

// Deletes an option from a modifier group
export function deleteModifierOption({
  catalogId,
  groupId,
  optionId,
}: DeleteModifierOptionPayload): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/catalogs/${catalogId}/modifiers/${groupId}/options/${optionId}`)
    .then((r) => r.data);
}
