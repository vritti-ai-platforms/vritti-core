import type { UseMutationOptions, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddAddressPayload, PartyAddressesTableResponse, PartyAddressRow } from '@/schemas/party-addresses';
import type {
  PartyBankAccountPayload,
  PartyBankAccountRow,
  PartyBankAccountsTableResponse,
} from '@/schemas/party-bank-accounts';
import type {
  PartyCommunicationPayload,
  PartyCommunicationRow,
  PartyCommunicationsTableResponse,
  PartyCommunicationUpdatePayload,
} from '@/schemas/party-communications';
import type {
  AddIdentifierPayload,
  IdentifierType,
  PartyIdentifierRow,
  PartyIdentifiersTableResponse,
} from '@/schemas/party-identifiers';
import type { PartyLicensePayload, PartyLicenseRow, PartyLicensesTableResponse } from '@/schemas/party-licenses';
import type {
  PartySocialProfilePayload,
  PartySocialProfileRow,
  PartySocialProfilesTableResponse,
} from '@/schemas/party-social-profiles';
import type {
  PartyRegistrationFormData,
  PartyRegistrationsTableResponse,
  PartyTaxRegistrationRow,
} from '@/schemas/party-registrations';

type SelectorOption = { value: string; label: string };

type QueryHook<TResponse> = (partyId: string) => UseQueryResult<TResponse, AxiosError>;

type MutationHook<TData, TVars> = (
  partyId: string,
  options?: Omit<UseMutationOptions<TData, AxiosError, TVars>, 'mutationFn'>,
) => UseMutationResult<TData, AxiosError, TVars>;

interface BaseBinding {
  permissions: { view: string; add: string; edit?: string; delete: string };
  slug: (partyId: string) => string;
  queryKey: (partyId: string) => readonly unknown[];
  emptyDescription: string;
}

export interface IdentifiersBinding extends BaseBinding {
  typeOptions: SelectorOption[];
  defaultType: IdentifierType;
  valuePlaceholder: string;
  useList: QueryHook<PartyIdentifiersTableResponse>;
  useCreate: MutationHook<PartyIdentifierRow, AddIdentifierPayload>;
  useRemove: MutationHook<SuccessResponse, string>;
}

export interface AddressesBinding extends BaseBinding {
  useList: QueryHook<PartyAddressesTableResponse>;
  useCreate: MutationHook<PartyAddressRow, AddAddressPayload>;
  useUpdate: MutationHook<SuccessResponse, { partyId: string; addressId: string; data: AddAddressPayload }>;
  useRemove: MutationHook<SuccessResponse, string>;
}

export interface RegistrationsBinding extends BaseBinding {
  useList: QueryHook<PartyRegistrationsTableResponse>;
  useCreate: MutationHook<PartyTaxRegistrationRow, PartyRegistrationFormData>;
  useUpdate: MutationHook<SuccessResponse, { registrationId: string; data: PartyRegistrationFormData }>;
  useRemove: MutationHook<SuccessResponse, string>;
}

export interface LicensesBinding extends BaseBinding {
  useList: QueryHook<PartyLicensesTableResponse>;
  useCreate: MutationHook<PartyLicenseRow, PartyLicensePayload>;
  useUpdate: MutationHook<SuccessResponse, { licenseId: string; data: PartyLicensePayload }>;
  useRemove: MutationHook<SuccessResponse, string>;
}

export interface BankAccountsBinding extends BaseBinding {
  useList: QueryHook<PartyBankAccountsTableResponse>;
  useCreate: MutationHook<PartyBankAccountRow, PartyBankAccountPayload>;
  useUpdate: MutationHook<SuccessResponse, { bankAccountId: string; data: PartyBankAccountPayload }>;
  useRemove: MutationHook<SuccessResponse, string>;
}

export interface CommunicationsBinding extends BaseBinding {
  useList: QueryHook<PartyCommunicationsTableResponse>;
  useCreate: MutationHook<PartyCommunicationRow, PartyCommunicationPayload>;
  useUpdate: MutationHook<SuccessResponse, { communicationId: string; data: PartyCommunicationUpdatePayload }>;
  useRemove: MutationHook<SuccessResponse, string>;
}

export interface SocialProfilesBinding extends BaseBinding {
  useList: QueryHook<PartySocialProfilesTableResponse>;
  useCreate: MutationHook<PartySocialProfileRow, PartySocialProfilePayload>;
  useUpdate: MutationHook<SuccessResponse, { profileId: string; data: PartySocialProfilePayload }>;
  useRemove: MutationHook<SuccessResponse, string>;
}
