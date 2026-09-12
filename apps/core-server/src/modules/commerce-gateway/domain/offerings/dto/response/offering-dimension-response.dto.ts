import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferingDimensionValueResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() dimensionId: string;
  @ApiProperty({ description: 'Segment this value contributes to a derived SKU', example: 'm' }) code: string;
  @ApiProperty() value: string;
  @ApiProperty() sortOrder: number;
  @ApiProperty({ description: 'False once a variant carries this value — its code is part of that SKU' })
  canDelete: boolean;
}

export class OfferingDimensionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() offeringId: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ description: 'Position of this segment in the derived SKU' }) sortOrder: number;
  @ApiProperty({ type: [OfferingDimensionValueResponseDto] }) values: OfferingDimensionValueResponseDto[];
  @ApiProperty() valueCount: number;
  @ApiProperty({ description: 'False once any variant carries a value on this axis' }) canDelete: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
