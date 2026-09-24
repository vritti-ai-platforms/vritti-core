import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

const FULFILMENT_TYPES = ['STOCK', 'ASSEMBLY', 'COMPOSITE', 'SERVICE'] as const;

export class SetFulfilmentDto {
  @ApiProperty({ enum: FULFILMENT_TYPES, description: 'What happens at picking — decides the bill of materials rules' })
  @IsEnum(FULFILMENT_TYPES)
  fulfilmentType: (typeof FULFILMENT_TYPES)[number];
}
