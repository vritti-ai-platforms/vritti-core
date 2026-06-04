import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CompleteConversionDto {
  @ApiProperty({ description: 'Inventory location ID where the conversion occurs' })
  @IsUUID()
  locationId: string;
}
