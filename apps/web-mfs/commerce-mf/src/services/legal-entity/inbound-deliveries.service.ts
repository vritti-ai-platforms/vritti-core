import axios from '@vritti/quantum-ui/axios';
import type {
  InboundDeliveriesTableResponse,
  InboundDeliveryData,
  InboundDeliveryLinesTableResponse,
} from '@/schemas/inbound-deliveries';

// Fetches the inbound deliveries of the legal entity's sites for the data table
export function getInboundDeliveriesTable(): Promise<InboundDeliveriesTableResponse> {
  return axios.get<InboundDeliveriesTableResponse>('commerce-api/le/inbound-deliveries/table').then((r) => r.data);
}

// Fetches one inbound delivery
export function getInboundDelivery(id: string): Promise<InboundDeliveryData> {
  return axios.get<InboundDeliveryData>(`commerce-api/le/inbound-deliveries/${id}`).then((r) => r.data);
}

// Fetches an inbound delivery's lines for the data table
export function getInboundDeliveryLinesTable(id: string): Promise<InboundDeliveryLinesTableResponse> {
  return axios
    .get<InboundDeliveryLinesTableResponse>(`commerce-api/le/inbound-deliveries/${id}/lines/table`)
    .then((r) => r.data);
}
