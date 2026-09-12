import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class CombinationAxisDto {
  @ApiProperty({ description: 'Dimension the values belong to' })
  @IsUUID()
  dimensionId: string;

  @ApiProperty({ type: [String], description: 'Values selected on this axis' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  valueIds: string[];
}

export class PreviewCombinationsDto {
  @ApiProperty({ type: [CombinationAxisDto], description: 'One entry per dimension taking part in this batch' })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CombinationAxisDto)
  axes: CombinationAxisDto[];
}
