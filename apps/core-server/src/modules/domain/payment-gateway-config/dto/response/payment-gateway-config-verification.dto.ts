import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentGatewayConfigVerificationDto {
  @ApiProperty({ description: 'When the provider accepted the stored credentials', example: '2024-01-15T10:30:00Z' })
  verifiedAt: string;

  @ApiPropertyOptional({
    description: 'Merchant id the provider reported, or the one already on file when it reports none',
    example: 'MID12345',
    nullable: true,
  })
  providerMerchantId: string | null;
}
