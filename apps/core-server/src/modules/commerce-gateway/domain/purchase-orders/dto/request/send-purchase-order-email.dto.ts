import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEmail, IsOptional } from 'class-validator';

export class SendPurchaseOrderEmailDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Override recipient email; defaults to supplier email' })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}
