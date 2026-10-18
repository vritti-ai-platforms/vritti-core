import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

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
}
