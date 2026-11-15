import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CloseSupplierDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Why the leg is closed', nullable: true, example: 'Supplier is out of stock.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string | null;
}
