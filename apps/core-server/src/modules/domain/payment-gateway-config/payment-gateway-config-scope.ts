// Narrows a by-id lookup to the legal entity (and bank account) the caller is acting in, so a record id from
// elsewhere in the organization reads as not found. An absent field is not checked.
export interface PaymentGatewayConfigScope {
  legalEntityId?: string;
  bankAccountId?: string;
}
