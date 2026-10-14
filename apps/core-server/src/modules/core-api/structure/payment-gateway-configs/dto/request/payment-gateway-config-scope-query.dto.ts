import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

// The legal entity and bank account cloud is acting in, so a config id from elsewhere in the organization is a 404
export class PaymentGatewayConfigScopeQueryDto {
  @ApiPropertyOptional({ description: 'Legal entity the config must belong to', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;

  @ApiPropertyOptional({ description: 'Bank account the config must settle into', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  bankAccountId?: string;
}
