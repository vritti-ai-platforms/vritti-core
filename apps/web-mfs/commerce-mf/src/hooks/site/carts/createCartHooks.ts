import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CartData, CartLinesData, CartsTableResponse } from '@/schemas/carts';
import type { AddCartLinePayload, createCartsService } from '@/services/site/carts.service';

type CartsService = ReturnType<typeof createCartsService>;

interface CartKeys {
  table: readonly unknown[];
  cart: (cartId: string) => readonly unknown[];
  items: (cartId: string) => readonly unknown[];
}

/**
 * One set of basket hooks, bound to a workspace.
 *
 * The queries are identical at an outlet and at the company — what differs is the route the service
 * calls and the permission code the read is gated on, so both are arguments rather than two copies
 * of the same file.
 *
 * Every line mutation answers with the **whole basket**, so the cache is *set* rather than
 * invalidated: the list redraws from the response instead of making a second round trip for what it
 * already has.
 */
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

  const useCart = (cartId: string, options?: Omit<UseQueryOptions<CartData, AxiosError>, 'queryKey' | 'queryFn'>) => {
    const { available } = usePermission(viewPermission);
    return useQuery<CartData, AxiosError>({
      queryKey: keys.cart(cartId),
      queryFn: () => service.getCart(cartId),
      enabled: available && Boolean(cartId),
      ...options,
    });
  };

  const useCartItems = (
    cartId: string,
    options?: Omit<UseQueryOptions<CartLinesData, AxiosError>, 'queryKey' | 'queryFn'>,
  ) => {
    const { available } = usePermission(viewPermission);
    return useQuery<CartLinesData, AxiosError>({
      queryKey: keys.items(cartId),
      queryFn: () => service.getCartItems(cartId),
      enabled: available && Boolean(cartId),
      ...options,
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
    useOpenCart,
    useAddCartLine,
    useUpdateCartLine,
    useRemoveCartLine,
    useCloseCart,
  };
}
