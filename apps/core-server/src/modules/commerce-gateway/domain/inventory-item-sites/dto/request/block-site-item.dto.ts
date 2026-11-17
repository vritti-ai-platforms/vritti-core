import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class BlockSiteItemDto {
  @ApiProperty({ description: 'Why the site stops buying the item', example: 'Recalled batch', maxLength: 500 })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason: string;
}
