import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

// The legal entity cloud is acting in, so an account id held by another legal entity of the organization is a 404
export class BankAccountScopeQueryDto {
  @ApiPropertyOptional({ description: 'Legal entity the bank account must belong to', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  legalEntityId?: string;
}
