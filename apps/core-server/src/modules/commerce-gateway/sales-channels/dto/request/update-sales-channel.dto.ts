import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSalesChannelDto {
  @ApiPropertyOptional({ description: 'Human-readable name' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Whether the channel is selectable' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
