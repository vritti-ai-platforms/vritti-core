import { ApiProperty } from '@nestjs/swagger';

export class BuSelectOptionDto {
  @ApiProperty({ example: 'uuid-here' })
  value: string;

  @ApiProperty({ example: 'US East Region' })
  label: string;

  @ApiProperty({ example: 'REGION' })
  description: string;
}

export class BuSelectResponseDto {
  @ApiProperty({ type: [BuSelectOptionDto] })
  options: BuSelectOptionDto[];

  @ApiProperty({ example: false })
  hasMore: boolean;
}
