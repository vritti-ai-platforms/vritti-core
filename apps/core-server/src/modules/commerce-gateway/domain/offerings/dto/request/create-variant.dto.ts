import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateVariantDto {
  @ApiProperty()
  @IsUUID()
  salesUomId: string;

  @ApiProperty({ type: [String], description: 'Exactly one value per dimension — a variant is a complete combination' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  valueIds: string[];

  @Trim()
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  externalSku?: string | null;
}
