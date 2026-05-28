export class AssociateCostDto {
  categoryId: string;
  // bigint serialized as string over NATS payload to dodge JSON precision loss.
  totalAmount: string;
  currencyCode: string;
  distributionMethod: 'by_value' | 'by_quantity' | 'equal';
  vendorRef?: string;
  notes?: string;
}
