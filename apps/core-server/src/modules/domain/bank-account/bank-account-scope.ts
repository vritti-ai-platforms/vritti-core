// Narrows a by-id lookup to the legal entity the caller is acting in, so an account held by another legal entity
// of the organization reads as not found. An absent field is not checked.
export interface BankAccountScope {
  legalEntityId?: string;
}
