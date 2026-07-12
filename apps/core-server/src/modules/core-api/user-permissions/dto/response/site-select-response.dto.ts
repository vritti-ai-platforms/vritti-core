import { ApiProperty } from '@nestjs/swagger';

export class SiteSelectOptionDto {
  @ApiProperty({ example: 'uuid-here' })
  value: string;

  @ApiProperty({ example: 'Mysore Outlet' })
  label: string;

  @ApiProperty({ example: 'OUTLET' })
  description: string;
}

export class SiteSelectResponseDto {
  @ApiProperty({ type: [SiteSelectOptionDto] })
  options: SiteSelectOptionDto[];

  @ApiProperty({ example: false })
  hasMore: boolean;
}
