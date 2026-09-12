import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
}
