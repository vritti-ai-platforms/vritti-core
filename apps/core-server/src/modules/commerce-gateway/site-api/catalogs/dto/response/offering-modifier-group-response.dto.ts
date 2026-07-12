import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferingModifierOptionResponseDto {
  @ApiProperty({ description: 'Option ID' })
  id: string;

  @ApiProperty({ description: 'Option name' })
  name: string;

  @ApiProperty({ description: 'Additional price' })
  additionalPrice: string;

  @ApiProperty({ description: 'Whether this option is selected by default' })
  isDefault: boolean;

  @ApiProperty({ description: 'Whether this option is available' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;
}

export class OfferingModifierGroupResponseDto {
  @ApiProperty({ description: 'Modifier group ID' })
  id: string;

  @ApiProperty({ description: 'Modifier group name' })
  name: string;

  @ApiProperty({ description: 'Selection type', enum: ['SINGLE', 'MULTI'] })
  selectionType: string;

  @ApiProperty({ description: 'Minimum number of selections' })
  minSelections: number;

  @ApiPropertyOptional({ description: 'Maximum number of selections' })
  maxSelections?: number;

  @ApiProperty({ description: 'Modifier options', type: [OfferingModifierOptionResponseDto] })
  options: OfferingModifierOptionResponseDto[];
}
