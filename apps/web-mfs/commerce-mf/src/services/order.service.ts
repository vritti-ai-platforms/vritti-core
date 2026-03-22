import type { AxiosResponse } from 'axios';
import axios from '@vritti/quantum-ui/axios';
import type { CreateOrderInput, Order } from '../schemas';

interface SuccessResponse {
  success: boolean;
  message: string;
}

interface FindOrdersParams {
  businessUnitId: string;
  status?: string;
  source?: string;
}

// Fetches all orders for an org+bu with optional filters
export function getOrders(params: FindOrdersParams): Promise<Order[]> {
  return axios
    .get<Order[]>('commerce-api/orders', { params })
    .then((r: AxiosResponse<Order[]>) => r.data);
}

// Fetches a single order with items
export function getOrderById(id: string): Promise<Order> {
  return axios.get<Order>(`commerce-api/orders/${id}`).then((r: AxiosResponse<Order>) => r.data);
}

// Creates a new order with items
export function createOrder(
  data: CreateOrderInput & { businessUnitId: string },
): Promise<Order> {
  return axios
    .post<Order>('commerce-api/orders', data, { successMessage: 'Order created' })
    .then((r: AxiosResponse<Order>) => r.data);
}

// Updates the order status
export function updateOrderStatus(id: string, status: string): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/orders/${id}/status`, { status }, { successMessage: 'Order status updated' })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}

// Adds items to an existing order
export function addOrderItems(
  orderId: string,
  items: CreateOrderInput['items'],
): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(`commerce-api/orders/${orderId}/items`, { orderId, items }, { successMessage: 'Items added' })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}

// Updates a single order item's status
export function updateOrderItemStatus(orderId: string, itemId: string, status: string): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/orders/${orderId}/items/${itemId}`, { status })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}
