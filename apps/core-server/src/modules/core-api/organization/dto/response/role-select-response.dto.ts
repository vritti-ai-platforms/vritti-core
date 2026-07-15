import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoleSelectOptionDto {
  @ApiProperty({ example: 'uuid-here' })
  value: string;

  @ApiProperty({ example: 'Store Cashier' })
  label: string;
}

export class RoleSelectResponseDto {
  @ApiProperty({ type: [RoleSelectOptionDto] })
  options: RoleSelectOptionDto[];

  @ApiProperty({ example: false })
  hasMore: boolean;

  @ApiPropertyOptional({ example: 4 })
  totalCount?: number;
}
