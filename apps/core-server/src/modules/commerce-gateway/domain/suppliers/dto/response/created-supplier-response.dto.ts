import { ApiProperty } from '@nestjs/swagger';

export class CreatedSupplierResponseDto {
  @ApiProperty({ description: 'The new supplier' })
  id: string;

  @ApiProperty({ description: 'Its code' })
  code: string;
}
