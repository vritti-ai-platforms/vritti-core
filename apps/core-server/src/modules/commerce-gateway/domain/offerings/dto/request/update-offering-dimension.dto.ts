import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateOfferingDimensionDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'New label; the code is fixed because every derived SKU carries it' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @Trim()
  @ApiPropertyOptional({ nullable: true, description: 'What this axis is for' })
  @IsString()
  @MaxLength(500)
  description?: string | null;
}
