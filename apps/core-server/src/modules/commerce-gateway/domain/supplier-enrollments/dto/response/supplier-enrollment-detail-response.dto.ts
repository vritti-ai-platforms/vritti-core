import { ApiPropertyOptional } from '@nestjs/swagger';
import { EnrollmentPurchasingResponseDto } from './enrollment-purchasing-response.dto';
import { SupplierEnrollmentRowResponseDto } from './supplier-enrollment-row-response.dto';

export class SupplierEnrollmentDetailResponseDto extends SupplierEnrollmentRowResponseDto {
  @ApiPropertyOptional({
    description: "The party's tax ID (PAN, TIN, EIN, UTR or ABN) from its identifiers, when on record",
    nullable: true,
  })
  partyTaxId: string | null;

  @ApiPropertyOptional({ description: 'The identifier type of partyTaxId', nullable: true })
  partyTaxIdType: string | null;

  @ApiPropertyOptional({
    type: () => EnrollmentPurchasingResponseDto,
    description: "The enrollment's purchasing settings, when enrolled",
    nullable: true,
  })
  purchasing: EnrollmentPurchasingResponseDto | null;
}
