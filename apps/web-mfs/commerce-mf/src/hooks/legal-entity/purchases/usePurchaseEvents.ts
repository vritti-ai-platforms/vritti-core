import { type InfiniteData, keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PurchaseEventsQuery, PurchaseEventsResponse } from '@/schemas/purchases';
import { getPurchaseEvents } from '@/services/legal-entity/purchases.service';
import { PURCHASE_EVENTS_QUERY_KEY } from './keys';

const PAGE_SIZE = 50;

// Pages through a purchase's activity, newest first, narrowed to a kind of event or one supplier
export function usePurchaseEvents(id: string, query: PurchaseEventsQuery) {
  return useInfiniteQuery<
    PurchaseEventsResponse,
    AxiosError,
    InfiniteData<PurchaseEventsResponse, number>,
    ReturnType<typeof PURCHASE_EVENTS_QUERY_KEY>,
    number
  >({
    queryKey: PURCHASE_EVENTS_QUERY_KEY(id, query),
    queryFn: ({ pageParam }) => getPurchaseEvents({ id, ...query, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.result.length, 0);
      return loaded < lastPage.count ? loaded : undefined;
    },
    placeholderData: keepPreviousData,
  });
}
