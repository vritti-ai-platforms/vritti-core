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

// Structural rather than `typeof SITE_…`, so this folder carries no scope bias — a basket is the
// same record at an outlet and at the company above it, and each scope's page passes its own codes.
export interface CartPermissions {
  view: string;
  add: string;
  edit: string;
  delete: string;
}

// A dialog owns its own mutation because Form has no onSuccess — closing it on success has to be
// wired where the hook is called. So the scope's hook is handed over rather than its result.
type MutationHook<TData, TVars> = (
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

type LineMutationHook<TVars> = (
  cartId: string,
  options?: Omit<UseMutationOptions<CartLinesData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<CartLinesData, AxiosError, TVars>;

export interface CartsBinding {
  // What to call the workspace in prose — "outlet", "company"
  scopeNoun: string;
  description: string;
  permissions: CartPermissions;
  // The table query's cache key — refetched whenever the table's filters, sort or search change
  tableKey: readonly unknown[];
  // Must equal the gateway's `getCurrentState` key, or saved views never come back
  tableSlug: string;
  // The items table's cache key and state key — per basket, so each keeps its own view
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
