import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { ModifierGroupData, ModifierOptionData } from '@/schemas/items';
import type { ModifierGroupDetail } from '@/schemas/modifiers';

// Lists all modifier groups for a business unit
export function listModifierGroups(buId: string): Promise<ModifierGroupData[]> {
  return axios
    .get<ModifierGroupData[]>(`commerce-api/modifier-groups?buId=${buId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches a single modifier group with its options
export function getModifierGroup(id: string): Promise<ModifierGroupDetail> {
  return axios
    .get<ModifierGroupDetail>(`commerce-api/modifier-groups/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

export interface CreateModifierGroupPayload {
  businessUnitId: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTI';
  minSelections?: number;
  maxSelections?: number;
  sortOrder?: number;
  isActive?: boolean;
}

// Creates a new modifier group
export function createModifierGroup(data: CreateModifierGroupPayload): Promise<ModifierGroupData> {
  return axios
    .post<ModifierGroupData>('commerce-api/modifier-groups', data)
    .then((r) => r.data);
}

export interface UpdateModifierGroupPayload {
  id: string;
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
export function updateModifierGroup({ id, data }: UpdateModifierGroupPayload): Promise<ModifierGroupData> {
  return axios
    .patch<ModifierGroupData>(`commerce-api/modifier-groups/${id}`, data)
    .then((r) => r.data);
}

// Deletes a modifier group by ID
export function deleteModifierGroup(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/modifier-groups/${id}`)
    .then((r) => r.data);
}

export interface CreateModifierOptionPayload {
  groupId: string;
  data: {
    name: string;
    additionalPrice: number;
    sortOrder?: number;
  };
}

// Adds an option to a modifier group
export function createModifierOption({ groupId, data }: CreateModifierOptionPayload): Promise<ModifierOptionData> {
  return axios
    .post<ModifierOptionData>(`commerce-api/modifier-groups/${groupId}/options`, data)
    .then((r) => r.data);
}

export interface DeleteModifierOptionPayload {
  groupId: string;
  optionId: string;
}

export interface UpdateModifierOptionPayload {
  groupId: string;
  optionId: string;
  data: { name?: string; additionalPrice?: number; isDefault?: boolean; isAvailable?: boolean };
}

// Updates a modifier option's properties
export function updateModifierOption({ groupId, optionId, data }: UpdateModifierOptionPayload): Promise<ModifierOptionData> {
  return axios
    .patch<ModifierOptionData>(`commerce-api/modifier-groups/${groupId}/options/${optionId}`, data)
    .then((r) => r.data);
}

// Deletes an option from a modifier group
export function deleteModifierOption({ groupId, optionId }: DeleteModifierOptionPayload): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/modifier-groups/${groupId}/options/${optionId}`)
    .then((r) => r.data);
}
