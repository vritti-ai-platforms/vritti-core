import { type UseMutationOptions, type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProductInput, Product, UpdateProductInput } from '../schemas';
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from '../services';

type UseProductsOptions = Omit<UseQueryOptions<Product[], Error>, 'queryKey' | 'queryFn'>;

// Fetches all products for an org+bu
export function useProducts(businessUnitId: string, options?: UseProductsOptions) {
  return useQuery<Product[], Error>({
    queryKey: ['commerce', 'products', businessUnitId],
    queryFn: () => getProducts(businessUnitId),
    enabled: !!businessUnitId,
    ...options,
  });
}

type UseProductOptions = Omit<UseQueryOptions<Product, Error>, 'queryKey' | 'queryFn'>;

// Fetches a single product by ID
export function useProduct(id: string, options?: UseProductOptions) {
  return useQuery<Product, Error>({
    queryKey: ['commerce', 'products', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
    ...options,
  });
}

type UseCreateProductOptions = Omit<
  UseMutationOptions<Product, Error, CreateProductInput & { businessUnitId: string }>,
  'mutationFn'
>;

// Creates a new product and invalidates the list
export function useCreateProduct(options?: UseCreateProductOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'products'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

interface UpdateProductParams {
  id: string;
  data: UpdateProductInput;
}

type UseUpdateProductOptions = Omit<UseMutationOptions<unknown, Error, UpdateProductParams>, 'mutationFn'>;

// Updates a product and invalidates the list
export function useUpdateProduct(options?: UseUpdateProductOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateProductParams) => updateProduct(id, data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'products'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

type UseDeleteProductOptions = Omit<UseMutationOptions<unknown, Error, string>, 'mutationFn'>;

// Deletes a product and invalidates the list
export function useDeleteProduct(options?: UseDeleteProductOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'products'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
