import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { PaymentLinkedAccountScopeQueryDto } from './payment-linked-account-scope-query.dto';

export class ListPaymentLinkedAccountsInternalQueryDto extends PaymentLinkedAccountScopeQueryDto {
  @ApiProperty({ description: 'Collector gateway config whose linked accounts to list', example: 'uuid-here' })
  @IsUUID()
  collectorConfigId: string;
}
