import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
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
