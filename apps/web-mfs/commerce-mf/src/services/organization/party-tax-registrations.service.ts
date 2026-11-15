import axios from '@vritti/quantum-ui/axios';
import type { SelectOptionsResponse } from '@vritti/quantum-ui/Select';

// Checks whether a party holds an active sales-tax (GSTIN or VAT) registration a site enrollment can be invoiced under
export function getPartyHasSalesTaxRegistration(partyId: string): Promise<boolean> {
  return axios
    .get<SelectOptionsResponse>('commerce-api/select-api/party-tax-registrations', {
      params: { partyId, salesTaxOnly: true, limit: 1 },
    })
    .then((r) => r.data.options.length > 0);
}
