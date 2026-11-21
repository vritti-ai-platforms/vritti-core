import { ApiProperty } from '@nestjs/swagger';

export class SupplierEnrollmentCountsResponseDto {
  @ApiProperty({
    description:
      "Supplier items the site lists: those it carries once the supplier is enrolled there, the supplier's whole catalog before",
    example: 12,
  })
  siteItemCount: number;

  @ApiProperty({
    description:
      "The supplier's quotations at the site: those posted to it from the legal entity, those the site reads in a site workspace",
    example: 2,
  })
  quotationCount: number;

  @ApiProperty({ description: "The supplier's invoices entered at the site", example: 4 })
  invoiceCount: number;
}
