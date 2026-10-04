import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

export class VariantCombinationInputDto {
  @ApiProperty({ type: [String], description: 'Exactly one value id per dimension on the offering' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  valueIds: string[];
}

export class GenerateVariantsDto {
  @ApiProperty({ description: 'Applies to every variant in this batch' })
  @IsUUID('7')
  salesUomId: string;

  @ApiProperty({ type: [VariantCombinationInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VariantCombinationInputDto)
  combinations: VariantCombinationInputDto[];

  @Trim()
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  namePrefix?: string | null;
}
