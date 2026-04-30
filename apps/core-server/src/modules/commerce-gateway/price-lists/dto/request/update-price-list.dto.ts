import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePriceListDto {
  @ApiPropertyOptional({ description: 'Price list name', example: 'Lunch Menu' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Price list code', example: 'PL-LUNCH' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Price list description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the price list is active' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
