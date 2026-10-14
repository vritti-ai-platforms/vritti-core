// Narrows a linked-account lookup to the legal entity that owns the collector config, so a linked account collected
// by another legal entity of the organization reads as not found. An absent field is not checked.
export interface PaymentLinkedAccountScope {
  legalEntityId?: string;
}
