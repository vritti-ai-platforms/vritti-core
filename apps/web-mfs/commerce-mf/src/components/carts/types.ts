import type {
  UseMutationOptions,
  UseMutationResult,
  UseQueryResult,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CartData, CartItemsTableResponse, CartLinesData, CartsTableResponse } from '@/schemas/carts';
import type { AddCartLinePayload } from '@/services/site/carts.service';

export interface CartPermissions {
  view: string;
  add: string;
  edit: string;
  delete: string;
}

type MutationHook<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

type LineMutationHook<TVars> = (
  cartId: string,
  options?: Omit<UseMutationOptions<CartLinesData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<CartLinesData, AxiosError, TVars>;

export interface CartsBinding {
  scopeNoun: string;
  description: string;
  permissions: CartPermissions;
  tableKey: readonly unknown[];
  tableSlug: string;
  itemsTableKey: (cartId: string) => readonly unknown[];
  itemsTableSlug: (cartId: string) => string;
  useCartsTable: () => UseQueryResult<CartsTableResponse, AxiosError>;
  useCart: (cartId: string) => UseSuspenseQueryResult<CartData, AxiosError>;
  useCartItems: (cartId: string) => UseSuspenseQueryResult<CartLinesData, AxiosError>;
  useCartItemsTable: (cartId: string) => UseQueryResult<CartItemsTableResponse, AxiosError>;
  useOpenCart: MutationHook<CartData, { partyId: string }>;
  useAddCartLine: LineMutationHook<AddCartLinePayload>;
  useUpdateCartLine: LineMutationHook<{ offeringVariantId: string; partyId: string; quantity: number }>;
  useRemoveCartLine: LineMutationHook<{ offeringVariantId: string; partyId: string }>;
  useCloseCart: MutationHook<SuccessResponse, string>;
}
