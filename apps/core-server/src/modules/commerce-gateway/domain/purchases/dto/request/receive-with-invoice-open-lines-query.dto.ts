import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ReceiveWithInvoiceOpenLinesQueryDto {
  @ApiProperty({ description: 'Supplier whose open Receive with Invoice allocations are listed' })
  @IsUUID('7')
  supplierId: string;

  @ApiPropertyOptional({ description: 'Receive with Invoice being edited; its own lines count as open' })
  @IsOptional()
  @IsUUID('7')
  excludeInvoiceId?: string;
}
