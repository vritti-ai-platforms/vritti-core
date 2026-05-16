import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type { CustomerData, CustomerDetail, CustomersTableResponse } from '@/schemas/customers';

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface UpdateCustomerPayload {
  name?: string;
  phone?: string;
  email?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

// Fetches customers for the data table
export function getCustomersTable(): Promise<CustomersTableResponse> {
  return axios
    .get<CustomersTableResponse>('commerce-api/customers/table', { showSuccessToast: false })
    .then((r) => r.data);
}

// Fetches a single customer by ID
export function getCustomer(id: string): Promise<CustomerDetail> {
  return axios.get<CustomerDetail>(`commerce-api/customers/${id}`, { showSuccessToast: false }).then((r) => r.data);
}

// Creates a new customer
export function createCustomer(data: CreateCustomerPayload): Promise<CustomerData> {
  return axios.post<CustomerData>('commerce-api/customers', data).then((r) => r.data);
}

// Updates a customer and returns the updated entity
export function updateCustomer({ id, data }: { id: string; data: UpdateCustomerPayload }): Promise<CustomerData> {
  return axios.patch<CustomerData>(`commerce-api/customers/${id}`, data).then((r) => r.data);
}

// Deletes a customer
export function deleteCustomer(id: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`commerce-api/customers/${id}`).then((r) => r.data);
}
