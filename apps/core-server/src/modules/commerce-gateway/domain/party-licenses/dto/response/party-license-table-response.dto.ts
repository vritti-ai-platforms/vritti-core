import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { PartyLicenseResponseDto } from './party-license-response.dto';

export class PartyLicenseTableResponseDto extends TableResponseDto<PartyLicenseResponseDto> {
  @ApiProperty({ type: [PartyLicenseResponseDto] })
  declare result: PartyLicenseResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
