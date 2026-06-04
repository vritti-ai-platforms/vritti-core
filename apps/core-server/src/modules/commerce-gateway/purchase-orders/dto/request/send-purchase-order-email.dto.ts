import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional } from 'class-validator';

export class SendPurchaseOrderEmailDto {
  @ApiPropertyOptional({ description: 'Override recipient email; defaults to supplier email' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
