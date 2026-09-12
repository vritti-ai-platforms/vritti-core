import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOfferingDimensionDto {
  @Trim({ nullify: false })
  @ApiProperty({ example: 'size' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ example: 'Size' })
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
