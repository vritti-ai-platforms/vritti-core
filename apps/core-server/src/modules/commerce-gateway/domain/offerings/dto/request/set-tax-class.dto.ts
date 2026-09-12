import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetTaxClassDto {
  @ApiProperty({ description: 'Tax class to apply' })
  @IsUUID()
  taxClassId: string;
}
