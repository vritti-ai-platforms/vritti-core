import { type UseMutationOptions, type UseQueryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderInput, Order } from '../schemas';
import { addOrderItems, createOrder, getOrderById, getOrders, updateOrderItemStatus, updateOrderStatus } from '../services';

interface OrderFilters {
  businessUnitId: string;
  status?: string;
  source?: string;
}

type UseOrdersOptions = Omit<UseQueryOptions<Order[], Error>, 'queryKey' | 'queryFn'>;

// Fetches all orders for an org+bu with optional filters
export function useOrders(filters: OrderFilters, options?: UseOrdersOptions) {
  return useQuery<Order[], Error>({
    queryKey: ['commerce', 'orders', filters],
    queryFn: () => getOrders(filters),
    enabled: !!filters.businessUnitId,
    ...options,
  });
}

type UseOrderOptions = Omit<UseQueryOptions<Order, Error>, 'queryKey' | 'queryFn'>;

// Fetches a single order with items
export function useOrder(id: string, options?: UseOrderOptions) {
  return useQuery<Order, Error>({
    queryKey: ['commerce', 'orders', id],
    queryFn: () => getOrderById(id),
    enabled: !!id,
    ...options,
  });
}

type UseCreateOrderOptions = Omit<
  UseMutationOptions<Order, Error, CreateOrderInput & { businessUnitId: string }>,
  'mutationFn'
>;

// Creates a new order and invalidates the list
export function useCreateOrder(options?: UseCreateOrderOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrder,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'orders'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

interface UpdateStatusParams {
  id: string;
  status: string;
}

type UseUpdateOrderStatusOptions = Omit<UseMutationOptions<unknown, Error, UpdateStatusParams>, 'mutationFn'>;

// Updates the order status and invalidates related queries
export function useUpdateOrderStatus(options?: UseUpdateOrderStatusOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: UpdateStatusParams) => updateOrderStatus(id, status),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'orders'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

interface AddItemsParams {
  orderId: string;
  items: CreateOrderInput['items'];
}

type UseAddOrderItemsOptions = Omit<UseMutationOptions<unknown, Error, AddItemsParams>, 'mutationFn'>;

// Adds items to an existing order
export function useAddOrderItems(options?: UseAddOrderItemsOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, items }: AddItemsParams) => addOrderItems(orderId, items),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'orders'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}

interface UpdateItemStatusParams {
  orderId: string;
  itemId: string;
  status: string;
}

type UseUpdateItemStatusOptions = Omit<UseMutationOptions<unknown, Error, UpdateItemStatusParams>, 'mutationFn'>;

// Updates a single order item's status
export function useUpdateOrderItemStatus(options?: UseUpdateItemStatusOptions) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, itemId, status }: UpdateItemStatusParams) =>
      updateOrderItemStatus(orderId, itemId, status),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['commerce', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['commerce', 'kot'] });
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
