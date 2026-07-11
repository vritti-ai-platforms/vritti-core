import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignedLegalEntityResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;
  @ApiProperty({ example: 'RK Pharmacy Pvt Ltd' })
  name: string;
  @ApiProperty({ example: 'rk-pharmacy' })
  code: string;
  @ApiProperty({ example: 'IN' })
  country: string;
  @ApiProperty({ example: 'INR' })
  currencyCode: string;
  @ApiProperty({ example: 'GST' })
  taxRegime: string;
  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  parentId: string | null;
}
