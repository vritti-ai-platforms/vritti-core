import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignedSiteGroupResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;
  @ApiProperty({ example: 'South Zone' })
  name: string;
  @ApiProperty({ example: 'south-zone' })
  code: string;
  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  parentId: string | null;
}
