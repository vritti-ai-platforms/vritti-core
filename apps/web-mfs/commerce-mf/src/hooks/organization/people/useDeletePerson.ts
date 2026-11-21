import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { invalidateWrites, Tables } from '@/hooks/shared/invalidation';
import { deletePerson } from '@/services/organization/people.service';

export function useDeletePerson(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deletePerson,
    onSuccess: (...args) => {
      invalidateWrites(queryClient, [
        Tables.parties,
        Tables.partyAddresses,
        Tables.partyIdentifiers,
        Tables.partyRelationships,
        Tables.partyTaxRegistrations,
        Tables.partyLicenses,
        Tables.partyBankAccounts,
        Tables.partyCommunications,
        Tables.partyCommunicationApps,
        Tables.partySocialProfiles,
        Tables.partyFunctions,
        Tables.carts,
        Tables.cartItems,
        Tables.checkouts,
        Tables.checkoutLines,
        Tables.wishlistItems,
        Tables.orders,
      ]);
      options?.onSuccess?.(...args);
    },
  });
}
