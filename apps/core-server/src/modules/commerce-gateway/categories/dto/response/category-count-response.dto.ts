import { ApiProperty } from '@nestjs/swagger';

export class CategoryCountResponseDto {
  @ApiProperty({ description: 'Total number of categories' })
  count: number;
}
