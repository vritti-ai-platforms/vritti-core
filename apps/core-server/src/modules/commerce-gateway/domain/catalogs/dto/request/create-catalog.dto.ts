import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCatalogDto {
  @ApiProperty({ example: 'Retail' })
  @IsString()
  @MaxLength(255)
  @Trim()
  name: string;

  @ApiPropertyOptional({ nullable: true, description: 'Owning legal entity; null means org-owned' })
  @IsOptional()
  @IsUUID('all')
  ownerLegalEntityId?: string | null;

  @ApiPropertyOptional({ description: 'Whether prices in this catalog include tax' })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @ApiPropertyOptional({ description: 'Higher wins when two catalogs reach the same channel' })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
