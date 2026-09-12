import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddBomLineData,
  CreateDimensionData,
  CreateDimensionFromTemplateData,
  CreateOfferingData,
  CreateVariantData,
  CreateVariantInventoryItemData,
  DeleteBomLineData,
  GenerateVariantsData,
  OfferingData,
  OfferingDimensionData,
  OfferingsTableResponse,
  OfferingVariantData,
  OfferingVariantsTableResponse,
  PreviewCombinationsData,
  ReorderDimensionsData,
  SetOfferingTaxClassData,
  SetVariantTaxClassData,
  UpdateBomLineData,
  UpdateDimensionData,
  UpdateOfferingFormData,
  UpsertDimensionValuesData,
  VariantCombinationsData,
} from '@/schemas/offerings';

const BASE = 'commerce-api/org/offerings';

// Every offering this workspace can reach — its own plus those owned above it
export function getOfferingsTable(): Promise<OfferingsTableResponse> {
  return axios.get<OfferingsTableResponse>(`${BASE}/table`, { showSuccessToast: false }).then((r) => r.data);
}

export function getOffering(id: string): Promise<OfferingData> {
  return axios.get<OfferingData>(`${BASE}/${id}`).then((r) => r.data);
}

export function createOffering(data: CreateOfferingData): Promise<CreateResponse<OfferingData>> {
  return axios.post<CreateResponse<OfferingData>>(BASE, data).then((r) => r.data);
}

export function updateOffering({ id, data }: { id: string; data: UpdateOfferingFormData }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}`, data).then((r) => r.data);
}

export function setOfferingStatus({ id, isActive }: { id: string; isActive: boolean }): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/status`, { isActive }).then((r) => r.data);
}

export function bulkSetOfferingsStatus({
  ids,
  isActive,
}: {
  ids: string[];
  isActive: boolean;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/status`, { ids, isActive }).then((r) => r.data);
}

export function deleteOffering(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/${id}`).then((r) => r.data);
}

// Dimensions, in the order their codes appear in a derived SKU
export function getDimensions(offeringId: string): Promise<OfferingDimensionData[]> {
  return axios.get<OfferingDimensionData[]>(`${BASE}/${offeringId}/dimensions`).then((r) => r.data);
}

// Appends a dimension seeded from a template — the copy keeps no link back to the template
export function createDimension({
  offeringId,
  ...data
}: CreateDimensionData): Promise<CreateResponse<OfferingDimensionData>> {
  return axios
    .post<CreateResponse<OfferingDimensionData>>(`${BASE}/${offeringId}/dimensions`, data)
    .then((r) => r.data);
}

// The template supplies code, name and values — only the reference is sent
export function createDimensionFromTemplate({
  offeringId,
  ...data
}: CreateDimensionFromTemplateData): Promise<CreateResponse<OfferingDimensionData>> {
  return axios
    .post<CreateResponse<OfferingDimensionData>>(`${BASE}/${offeringId}/dimensions/from-template`, data)
    .then((r) => r.data);
}

// Replaces a dimension's value set
export function upsertDimensionValues({ dimensionId, ...data }: UpsertDimensionValuesData): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`${BASE}/dimensions/${dimensionId}/values`, data).then((r) => r.data);
}
// Position drives SKU segment order, so the whole ordered list travels together
export function reorderDimensions({ offeringId, dimensionIds }: ReorderDimensionsData): Promise<SuccessResponse> {
  return axios.put<SuccessResponse>(`${BASE}/${offeringId}/dimensions/order`, { dimensionIds }).then((r) => r.data);
}

export function deleteDimension(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/dimensions/${id}`).then((r) => r.data);
}

// Variants with their dimension values and bill of materials
export function getVariant(variantId: string): Promise<OfferingVariantData> {
  return axios.get<OfferingVariantData>(`${BASE}/variants/${variantId}`).then((r) => r.data);
}

export function getVariantsTable(offeringId: string): Promise<OfferingVariantsTableResponse> {
  return axios
    .get<OfferingVariantsTableResponse>(`${BASE}/${offeringId}/variants/table`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function getVariants(offeringId: string): Promise<OfferingVariantData[]> {
  return axios.get<OfferingVariantData[]>(`${BASE}/${offeringId}/variants`).then((r) => r.data);
}

export function previewVariantCombinations({
  offeringId,
  ...data
}: PreviewCombinationsData): Promise<VariantCombinationsData> {
  return axios
    .post<VariantCombinationsData>(`${BASE}/${offeringId}/variants/combinations`, data, { showSuccessToast: false })
    .then((r) => r.data);
}

// Additive — combinations that already exist are skipped, never recreated
// One combination added by hand; the server derives the SKU exactly as generation would
export function createVariant({
  offeringId,
  ...data
}: CreateVariantData): Promise<CreateResponse<OfferingVariantData>> {
  return axios.post<CreateResponse<OfferingVariantData>>(`${BASE}/${offeringId}/variants`, data).then((r) => r.data);
}

export function generateVariants({ offeringId, ...data }: GenerateVariantsData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/${offeringId}/variants/generate`, data).then((r) => r.data);
}

export function updateVariant({
  id,
  data,
}: {
  id: string;
  data: { name?: string; externalSku?: string | null; isActive?: boolean };
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/variants/${id}`, data).then((r) => r.data);
}

export function bulkSetVariantsStatus({
  offeringId,
  ids,
  isActive,
}: {
  offeringId: string;
  ids: string[];
  isActive: boolean;
}): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${offeringId}/variants/status`, { ids, isActive }).then((r) => r.data);
}

// Replaces a variant's bill of materials as a set

export function deleteVariant(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/variants/${id}`).then((r) => r.data);
}

// Creates the inventory item this variant resolves to and links it as the variant's component. Lives on
// the offerings API rather than inventory items because that is where the variant context is.
export function createInventoryItem({
  variantId,
  ...data
}: CreateVariantInventoryItemData): Promise<CreateResponse<OfferingVariantData>> {
  return axios
    .post<CreateResponse<OfferingVariantData>>(`${BASE}/variants/${variantId}/bom/inventory-item`, data)
    .then((r) => r.data);
}

// Links the item already carrying this variant's SKU — the server resolves it, so nothing is named here
export function addSuggestedComponent(variantId: string): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/variants/${variantId}/bom/suggested`).then((r) => r.data);
}

// One component at a time — the whole-list replace could silently drop a concurrent edit
export function addBomLine({ variantId, ...data }: AddBomLineData): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`${BASE}/variants/${variantId}/bom/lines`, data).then((r) => r.data);
}

export function updateBomLine({ variantId, lineId, ...data }: UpdateBomLineData): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/variants/${variantId}/bom/lines/${lineId}`, data).then((r) => r.data);
}

export function deleteBomLine({ variantId, lineId }: DeleteBomLineData): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/variants/${variantId}/bom/lines/${lineId}`).then((r) => r.data);
}

// Its own endpoint: setting it cascades to every variant that has not pinned its own tax class
export function setOfferingTaxClass({ id, taxClassId }: SetOfferingTaxClassData): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/${id}/tax-class`, { taxClassId }).then((r) => r.data);
}

export function setVariantTaxClass({ variantId, taxClassId }: SetVariantTaxClassData): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/variants/${variantId}/tax-class`, { taxClassId }).then((r) => r.data);
}

export function clearVariantTaxClass(variantId: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`${BASE}/variants/${variantId}/tax-class`).then((r) => r.data);
}

// Renames a dimension; its code is fixed because every derived SKU carries it
export function updateDimension({ id, name }: UpdateDimensionData): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`${BASE}/dimensions/${id}`, { name }).then((r) => r.data);
}
