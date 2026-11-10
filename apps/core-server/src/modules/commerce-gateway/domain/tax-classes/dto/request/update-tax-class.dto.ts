import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTaxClassDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Human-readable name', example: 'Medicines' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;
}
