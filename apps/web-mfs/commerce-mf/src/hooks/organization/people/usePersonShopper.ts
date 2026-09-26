import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_PEOPLE } from '@vritti/commerce-permissions/people';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { PersonWishlistRow } from '@/schemas/person-shopper';
import { getPersonWishlist } from '@/services/organization/people.service';
import { PERSON_WISHLIST_KEY } from './keys';

/**
 * What they saved for later. Read only — staff have no write on a shopper's own list.
 *
 * Their basket is no longer here: a basket belongs to the outlet it was opened at, so it lives under
 * Site → Carts rather than on the person.
 */
export function usePersonWishlist(
  personId: string,
  options?: Omit<UseQueryOptions<PersonWishlistRow[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_PEOPLE.wishlist.view);
  return useQuery<PersonWishlistRow[], AxiosError>({
    queryKey: PERSON_WISHLIST_KEY(personId),
    queryFn: () => getPersonWishlist(personId),
    ...options,
    enabled: !!personId && available && (options?.enabled ?? true),
  });
}
