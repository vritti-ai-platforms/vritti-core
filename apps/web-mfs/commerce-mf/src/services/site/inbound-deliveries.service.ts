import axios from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddInboundDeliveryLinesPayload,
  CreateInboundDeliveryPayload,
  InboundDeliveriesTableResponse,
  InboundDeliveryData,
  InboundDeliveryLineRef,
  InboundDeliveryLinesTableResponse,
  UpdateInboundDeliveryLinePayload,
  UpdateInboundDeliveryPayload,
  UpdateInboundDeliveryStatusPayload,
} from '@/schemas/inbound-deliveries';

// Fetches the site's inbound deliveries for the data table
export function getInboundDeliveriesTable(): Promise<InboundDeliveriesTableResponse> {
  return axios.get<InboundDeliveriesTableResponse>('commerce-api/site/inbound-deliveries/table').then((r) => r.data);
}

// Fetches one inbound delivery
export function getInboundDelivery(id: string): Promise<InboundDeliveryData> {
  return axios.get<InboundDeliveryData>(`commerce-api/site/inbound-deliveries/${id}`).then((r) => r.data);
}

// Fetches an inbound delivery's lines for the data table
export function getInboundDeliveryLinesTable(id: string): Promise<InboundDeliveryLinesTableResponse> {
  return axios
    .get<InboundDeliveryLinesTableResponse>(`commerce-api/site/inbound-deliveries/${id}/lines/table`)
    .then((r) => r.data);
}

// Creates an inbound delivery from a supplier at the site
export function createInboundDelivery(
  data: CreateInboundDeliveryPayload,
): Promise<CreateResponse<InboundDeliveryData>> {
  return axios
    .post<CreateResponse<InboundDeliveryData>>('commerce-api/site/inbound-deliveries', data)
    .then((r) => r.data);
}

// Updates a delivery's expected date, carrier, tracking number and notes
export function updateInboundDelivery({ id, ...data }: UpdateInboundDeliveryPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/site/inbound-deliveries/${id}`, data).then((r) => r.data);
}

// Moves a delivery along its manual workflow or cancels it
export function updateInboundDeliveryStatus({
  id,
  ...data
}: UpdateInboundDeliveryStatusPayload): Promise<SuccessResponse> {
  return axios.patch<SuccessResponse>(`commerce-api/site/inbound-deliveries/${id}/status`, data).then((r) => r.data);
}

// Deletes a delivery
export function deleteInboundDelivery(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/site/inbound-deliveries/${id}`).then((r) => r.data);
}

// Puts purchase order lines on a delivery in one batch
export function addInboundDeliveryLines({ id, ...data }: AddInboundDeliveryLinesPayload): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/site/inbound-deliveries/${id}/lines`, data).then((r) => r.data);
}

// Changes the quantity of a delivery line
export function updateInboundDeliveryLine({
  id,
  lineId,
  ...data
}: UpdateInboundDeliveryLinePayload): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/site/inbound-deliveries/${id}/lines/${lineId}`, data)
    .then((r) => r.data);
}

// Takes a line off a delivery
export function removeInboundDeliveryLine({ id, lineId }: InboundDeliveryLineRef): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/site/inbound-deliveries/${id}/lines/${lineId}`)
    .then((r) => r.data);
}
