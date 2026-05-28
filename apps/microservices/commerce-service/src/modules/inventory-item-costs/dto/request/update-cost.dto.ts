export class UpdateCostDto {
  totalAmount?: string;
  distributionMethod?: 'by_value' | 'by_quantity' | 'equal';
  vendorRef?: string | null;
  notes?: string | null;
}
