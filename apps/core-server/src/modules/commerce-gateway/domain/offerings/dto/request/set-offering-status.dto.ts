import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetOfferingStatusDto {
  @ApiProperty({ description: 'Refused while the offering has no variants' })
  @IsBoolean()
  isActive: boolean;
}
