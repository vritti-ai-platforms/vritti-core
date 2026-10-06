import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferingAttributeValueResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() attributeId: string;
  @ApiProperty({ description: 'Code a storefront filters by', example: 'high-protein' }) code: string;
  @ApiProperty() value: string;
  @ApiProperty() sortOrder: number;
  @ApiProperty({ description: 'False once a variant carries this value' })
  canDelete: boolean;
}

export class OfferingAttributeResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() offeringId: string;
  @ApiProperty() code: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ description: 'Position of this group in a storefront filter rail' }) sortOrder: number;
  @ApiProperty({ type: [OfferingAttributeValueResponseDto] }) values: OfferingAttributeValueResponseDto[];
  @ApiProperty() valueCount: number;
  @ApiProperty({ description: 'False once any variant carries a value on this axis' }) canDelete: boolean;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
