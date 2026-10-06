import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CartData, CartItemsTableResponse, CartLinesData, CartsTableResponse } from '@/schemas/carts';
import type { AddCartLinePayload, createCartsService } from '@/services/site/carts.service';

type CartsService = ReturnType<typeof createCartsService>;

interface CartKeys {
  table: readonly unknown[];
  cart: (cartId: string) => readonly unknown[];
  items: (cartId: string) => readonly unknown[];
  itemsTable: (cartId: string) => readonly unknown[];
}

// One set of basket hooks, bound to a workspace
export function createCartHooks(service: CartsService, keys: CartKeys, viewPermission: string) {
  const useCartsTable = (options?: Omit<UseQueryOptions<CartsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>) => {
    const { available } = usePermission(viewPermission);
    return useQuery<CartsTableResponse, AxiosError>({
      queryKey: keys.table,
      queryFn: service.getCartsTable,
      enabled: available,
      ...options,
    });
  };

  // Suspense, like every other detail read: the route holds the skeleton, so the page can treat the
  // basket as present instead of threading `undefined` through every field it renders.
  const useCart = (cartId: string) =>
    useSuspenseQuery<CartData, AxiosError>({
      queryKey: keys.cart(cartId),
      queryFn: () => service.getCart(cartId),
    });

  const useCartItems = (cartId: string) =>
    useSuspenseQuery<CartLinesData, AxiosError>({
      queryKey: keys.items(cartId),
      queryFn: () => service.getCartItems(cartId),
    });

  // Self-gated like every table read: without the permission no request is made
  const useCartItemsTable = (
    cartId: string,
    options?: Omit<UseQueryOptions<CartItemsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
  ) => {
    const { available } = usePermission(viewPermission);
    return useQuery<CartItemsTableResponse, AxiosError>({
      queryKey: keys.itemsTable(cartId),
      queryFn: () => service.getCartItemsTable(cartId),
      ...options,
      enabled: !!cartId && available && (options?.enabled ?? true),
    });
  };

  const useOpenCart = (options?: Omit<UseMutationOptions<CartData, AxiosError, { partyId: string }>, 'mutationFn'>) => {
    const queryClient = useQueryClient();
    return useMutation<CartData, AxiosError, { partyId: string }>({
      ...options,
      mutationFn: service.openCart,
      onSuccess: (...args) => {
        queryClient.invalidateQueries({ queryKey: keys.table });
        options?.onSuccess?.(...args);
      },
    });
  };

  const useAddCartLine = (
    cartId: string,
    options?: Omit<UseMutationOptions<CartLinesData, AxiosError, AddCartLinePayload>, 'mutationFn'>,
  ) => {
    const queryClient = useQueryClient();
    return useMutation<CartLinesData, AxiosError, AddCartLinePayload>({
      ...options,
      mutationFn: (data) => service.addCartLine({ id: cartId, data }),
      onSuccess: (lines, ...rest) => {
        queryClient.setQueryData(keys.items(cartId), lines);
        queryClient.invalidateQueries({ queryKey: keys.itemsTable(cartId) });
        queryClient.invalidateQueries({ queryKey: keys.cart(cartId) });
        queryClient.invalidateQueries({ queryKey: keys.table });
        options?.onSuccess?.(lines, ...rest);
      },
    });
  };

  const useUpdateCartLine = (
    cartId: string,
    options?: Omit<
      UseMutationOptions<CartLinesData, AxiosError, { offeringVariantId: string; partyId: string; quantity: number }>,
      'mutationFn'
    >,
  ) => {
    const queryClient = useQueryClient();
    return useMutation<CartLinesData, AxiosError, { offeringVariantId: string; partyId: string; quantity: number }>({
      ...options,
      mutationFn: ({ offeringVariantId, partyId, quantity }) =>
        service.updateCartLine({ id: cartId, offeringVariantId, data: { partyId, quantity } }),
      onSuccess: (lines, ...rest) => {
        queryClient.setQueryData(keys.items(cartId), lines);
        queryClient.invalidateQueries({ queryKey: keys.itemsTable(cartId) });
        queryClient.invalidateQueries({ queryKey: keys.cart(cartId) });
        options?.onSuccess?.(lines, ...rest);
      },
    });
  };

  const useRemoveCartLine = (
    cartId: string,
    options?: Omit<
      UseMutationOptions<CartLinesData, AxiosError, { offeringVariantId: string; partyId: string }>,
      'mutationFn'
    >,
  ) => {
    const queryClient = useQueryClient();
    return useMutation<CartLinesData, AxiosError, { offeringVariantId: string; partyId: string }>({
      ...options,
      mutationFn: ({ offeringVariantId, partyId }) =>
        service.removeCartLine({ id: cartId, offeringVariantId, partyId }),
      onSuccess: (lines, ...rest) => {
        queryClient.setQueryData(keys.items(cartId), lines);
        queryClient.invalidateQueries({ queryKey: keys.itemsTable(cartId) });
        queryClient.invalidateQueries({ queryKey: keys.cart(cartId) });
        queryClient.invalidateQueries({ queryKey: keys.table });
        options?.onSuccess?.(lines, ...rest);
      },
    });
  };

  const useCloseCart = (options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>) => {
    const queryClient = useQueryClient();
    return useMutation<SuccessResponse, AxiosError, string>({
      ...options,
      mutationFn: service.closeCart,
      onSuccess: (...args) => {
        queryClient.invalidateQueries({ queryKey: keys.table });
        options?.onSuccess?.(...args);
      },
    });
  };

  return {
    useCartsTable,
    useCart,
    useCartItems,
    useCartItemsTable,
    useOpenCart,
    useAddCartLine,
    useUpdateCartLine,
    useRemoveCartLine,
    useCloseCart,
  };
}
