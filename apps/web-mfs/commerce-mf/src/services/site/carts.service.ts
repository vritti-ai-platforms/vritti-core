import axios from '@vritti/quantum-ui/axios';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { CartData, CartLinesData, CartsTableResponse } from '@/schemas/carts';

export interface AddCartLinePayload {
  partyId: string;
  offeringVariantId: string;
  quantity: number;
}

/**
 * The same calls, against whichever workspace's baskets.
 *
 * A basket is the same record at an outlet and at the company above it — only the route prefix
 * differs, because that is how the gateway knows which workspace is asking. One factory rather than
 * two files of identical axios wrappers that would drift the first time one of them changed.
 */
export function createCartsService(base: 'site' | 'le') {
  const root = `commerce-api/${base}/carts`;

  return {
    getCartsTable: (): Promise<CartsTableResponse> =>
      axios.get<CartsTableResponse>(`${root}/table`, { showSuccessToast: false }).then((r) => r.data),

    getCart: (id: string): Promise<CartData> =>
      axios.get<CartData>(`${root}/${id}`, { showSuccessToast: false }).then((r) => r.data),

    getCartItems: (id: string): Promise<CartLinesData> =>
      axios.get<CartLinesData>(`${root}/${id}/items`, { showSuccessToast: false }).then((r) => r.data),

    openCart: (data: { partyId: string }): Promise<CartData> => axios.post<CartData>(root, data).then((r) => r.data),

    addCartLine: ({ id, data }: { id: string; data: AddCartLinePayload }): Promise<CartLinesData> =>
      axios.post<CartLinesData>(`${root}/${id}/items`, data).then((r) => r.data),

    updateCartLine: ({
      id,
      offeringVariantId,
      data,
    }: {
      id: string;
      offeringVariantId: string;
      data: { partyId: string; quantity: number };
    }): Promise<CartLinesData> =>
      axios.patch<CartLinesData>(`${root}/${id}/items/${offeringVariantId}`, data).then((r) => r.data),

    removeCartLine: ({
      id,
      offeringVariantId,
      partyId,
    }: {
      id: string;
      offeringVariantId: string;
      partyId: string;
    }): Promise<CartLinesData> =>
      axios
        .delete<CartLinesData>(`${root}/${id}/items/${offeringVariantId}`, { params: { partyId } })
        .then((r) => r.data),

    closeCart: (id: string): Promise<SuccessResponse> =>
      axios.delete<SuccessResponse>(`${root}/${id}`).then((r) => r.data),
  };
}

export const cartsService = createCartsService('site');
