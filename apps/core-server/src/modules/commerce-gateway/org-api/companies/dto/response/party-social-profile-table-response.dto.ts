import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { PartySocialProfileResponseDto } from './party-social-profile-response.dto';

export class PartySocialProfileTableResponseDto extends TableResponseDto<PartySocialProfileResponseDto> {
  @ApiProperty({ type: [PartySocialProfileResponseDto] })
  declare result: PartySocialProfileResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
