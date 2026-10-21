import { ApiProperty } from '@nestjs/swagger';

export class PaymentGatewayConfigVerificationDto {
  @ApiProperty({ description: 'When the provider accepted the stored credentials', example: '2024-01-15T10:30:00Z' })
  verifiedAt: string;

  @ApiProperty({ description: "The main account's id on file", example: 'acc_Tpmw33BnyMhFUf' })
  gatewayAccountId: string;
}
