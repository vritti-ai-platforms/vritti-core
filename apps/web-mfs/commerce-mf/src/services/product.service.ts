import type { AxiosResponse } from 'axios';
import axios from '@vritti/quantum-ui/axios';
import type { CreateProductInput, Product, UpdateProductInput } from '../schemas';

interface SuccessResponse {
  success: boolean;
  message: string;
}

// Fetches all products for an org+bu
export function getProducts(businessUnitId: string): Promise<Product[]> {
  return axios
    .get<Product[]>('commerce-api/products', { params: { businessUnitId } })
    .then((r: AxiosResponse<Product[]>) => r.data);
}

// Fetches a single product by ID
export function getProductById(id: string): Promise<Product> {
  return axios.get<Product>(`commerce-api/products/${id}`).then((r: AxiosResponse<Product>) => r.data);
}

// Creates a new product
export function createProduct(
  data: CreateProductInput & { businessUnitId: string },
): Promise<Product> {
  return axios
    .post<Product>('commerce-api/products', data, { successMessage: 'Product created' })
    .then((r: AxiosResponse<Product>) => r.data);
}

// Updates an existing product
export function updateProduct(id: string, data: UpdateProductInput): Promise<SuccessResponse> {
  return axios
    .patch<SuccessResponse>(`commerce-api/products/${id}`, data, { successMessage: 'Product updated' })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}

// Deletes a product
export function deleteProduct(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/products/${id}`, { successMessage: 'Product deleted' })
    .then((r: AxiosResponse<SuccessResponse>) => r.data);
}
