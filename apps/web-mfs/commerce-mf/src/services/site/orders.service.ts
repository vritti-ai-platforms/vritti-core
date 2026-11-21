import axios from '@vritti/quantum-ui/axios';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  OrderCounts,
  OrderData,
  OrderDetail,
  OrderPayment,
  OrderStatus,
  OrdersTableResponse,
} from '@/schemas/orders';

export interface CreateOrderPayload {
  type: string;
  channel: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  serviceCharge?: number;
  deliveryCharge?: number;
  discountAmount?: number;
  items?: {
    offeringVariantId: string;
    quantity: number;
    notes?: string;
  }[];
}

export function getOrdersTable(): Promise<OrdersTableResponse> {
  return axios
    .get<OrdersTableResponse>('commerce-api/site/orders/table', { showSuccessToast: false })
    .then((r) => r.data);
}

export function createOrder(data: CreateOrderPayload): Promise<OrderData> {
  return axios.post<OrderData>('commerce-api/site/orders', data).then((r) => r.data);
}

export function getOrder(id: string): Promise<OrderDetail> {
  return axios.get<OrderDetail>(`commerce-api/site/orders/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

// Fetches how many items and payments an order has, one per tab
export function getOrderCounts(id: string): Promise<OrderCounts> {
  return axios
    .get<OrderCounts>(`commerce-api/site/orders/${id}/counts`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function updateOrderStatus({ id, status }: { id: string; status: OrderStatus }): Promise<SuccessResponse> {
  return axios.post<SuccessResponse>(`commerce-api/site/orders/${id}/status`, { status }).then((r) => r.data);
}

export function getOrderPayments(id: string): Promise<OrderPayment[]> {
  return axios
    .get<OrderPayment[]>(`commerce-api/site/orders/${id}/payments`, { showSuccessToast: false })
    .then((r) => r.data);
}

export function refundOrderPayment({
  id,
  paymentIntentId,
}: {
  id: string;
  paymentIntentId: string;
}): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`commerce-api/site/orders/${id}/payments/${paymentIntentId}/refund`)
    .then((r) => r.data);
}

// Asks the gateway where a pending refund stands; the answer's message says what it found
export function checkOrderPaymentRefund({
  id,
  paymentIntentId,
}: {
  id: string;
  paymentIntentId: string;
}): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`commerce-api/site/orders/${id}/payments/${paymentIntentId}/refund/check`)
    .then((r) => r.data);
}
