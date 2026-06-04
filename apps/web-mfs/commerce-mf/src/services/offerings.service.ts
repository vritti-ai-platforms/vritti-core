import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  CreateVariantData,
  CurrencyAmount,
  FulfilmentType,
  OfferingData,
  OfferingDetail,
  OfferingModifierGroup,
  OfferingsTableResponse,
  OfferingVariant,
  UpdateVariantData,
  VariantComponentInput,
} from '@/schemas/offerings';

export interface CreateOfferingDefaultVariant {
  sku?: string;
  price: CurrencyAmount;
  isAvailable?: boolean;
  components?: VariantComponentInput[];
}

export interface CreateOfferingPayload {
  catalogId?: string;
  fulfilmentType: FulfilmentType;
  name: string;
  description?: string;
  salesTaxGroupId?: string;
  categoryId?: string;
  isAvailable?: boolean;
  variantOptionIds?: string[];
  defaultVariant?: CreateOfferingDefaultVariant;
}

export interface UpdateOfferingPayload {
  name?: string;
  description?: string | null;
  salesTaxGroupId?: string | null;
  categoryId?: string | null;
  isAvailable?: boolean;
  variantOptionIds?: string[];
}

// Fetches offerings for the data table — server applies filter/sort state
export function getOfferingsTable(catalogId: string): Promise<OfferingsTableResponse> {
  return axios
    .get<OfferingsTableResponse>(`commerce-api/catalogs/${catalogId}/offerings`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new offering within a catalog
export function createOffering({
  catalogId,
  data,
}: {
  catalogId: string;
  data: CreateOfferingPayload;
}): Promise<OfferingData> {
  return axios.post<OfferingData>(`commerce-api/catalogs/${catalogId}/offerings`, data).then((r) => r.data);
}

// Fetches full offering details by ID
export function getOffering({
  catalogId,
  offeringId,
}: {
  catalogId: string;
  offeringId: string;
}): Promise<OfferingDetail> {
  return axios
    .get<OfferingDetail>(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates an offering's basic info
export function updateOffering({
  catalogId,
  offeringId,
  data,
}: {
  catalogId: string;
  offeringId: string;
  data: UpdateOfferingPayload;
}): Promise<OfferingData> {
  return axios
    .patch<OfferingData>(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}`, data)
    .then((r) => r.data);
}

// Deletes an offering by ID
export function deleteOffering({
  catalogId,
  offeringId,
}: {
  catalogId: string;
  offeringId: string;
}): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}`)
    .then((r) => r.data);
}

// Creates a single variant from a selected combination of option values
export function createVariant({
  catalogId,
  offeringId,
  data,
}: {
  catalogId: string;
  offeringId: string;
  data: CreateVariantData;
}): Promise<OfferingVariant> {
  return axios
    .post<OfferingVariant>(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}/variants`, data)
    .then((r) => r.data);
}

// Lists all variants for an offering
export function listVariants({
  catalogId,
  offeringId,
}: {
  catalogId: string;
  offeringId: string;
}): Promise<OfferingVariant[]> {
  return axios
    .get<OfferingVariant[]>(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}/variants`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Updates a single variant
export function updateVariant({
  catalogId,
  offeringId,
  variantId,
  data,
}: {
  catalogId: string;
  offeringId: string;
  variantId: string;
  data: UpdateVariantData;
}): Promise<OfferingVariant> {
  return axios
    .patch<OfferingVariant>(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}/variants/${variantId}`, data)
    .then((r) => r.data);
}

// Lists modifier groups assigned to an offering
export function listOfferingModifiers({
  catalogId,
  offeringId,
}: {
  catalogId: string;
  offeringId: string;
}): Promise<OfferingModifierGroup[]> {
  return axios
    .get<OfferingModifierGroup[]>(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}/modifiers`, {
      showSuccessToast: false,
    })
    .then((r) => r.data);
}

// Deletes a single variant from an offering
export function deleteVariant({
  catalogId,
  offeringId,
  variantId,
}: {
  catalogId: string;
  offeringId: string;
  variantId: string;
}): Promise<void> {
  return axios
    .delete(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}/variants/${variantId}`)
    .then(() => undefined);
}

// Assigns modifier groups to an offering (replaces all)
export function saveOfferingModifiers({
  catalogId,
  offeringId,
  groupIds,
}: {
  catalogId: string;
  offeringId: string;
  groupIds: string[];
}): Promise<OfferingModifierGroup[]> {
  return axios
    .put<OfferingModifierGroup[]>(`commerce-api/catalogs/${catalogId}/offerings/${offeringId}/modifiers`, { groupIds })
    .then((r) => r.data);
}
