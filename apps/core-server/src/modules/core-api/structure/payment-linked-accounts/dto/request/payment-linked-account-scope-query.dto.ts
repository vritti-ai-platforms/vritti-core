import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

// The legal entity cloud is acting in, so a linked account collected by another legal entity is a 404
export class PaymentLinkedAccountScopeQueryDto {
  @ApiPropertyOptional({ description: 'Legal entity the collector config must belong to', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;
}
