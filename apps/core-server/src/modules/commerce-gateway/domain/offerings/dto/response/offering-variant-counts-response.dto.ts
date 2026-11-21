import { ApiProperty } from '@nestjs/swagger';

export class OfferingVariantCountsResponseDto {
  @ApiProperty({ description: "Components on the variant's bill of materials", example: 2 })
  bomLineCount: number;
}
