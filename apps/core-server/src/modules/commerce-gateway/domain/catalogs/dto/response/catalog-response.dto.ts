import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CatalogResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ nullable: true }) ownerLegalEntityId: string | null;
  @ApiProperty() taxInclusive: boolean;
  @ApiProperty() priority: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() listingCount: number;
  @ApiProperty() channelCount: number;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
