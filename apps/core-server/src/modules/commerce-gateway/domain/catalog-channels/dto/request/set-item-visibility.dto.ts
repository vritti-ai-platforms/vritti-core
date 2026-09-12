import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetItemVisibilityDto {
  @ApiProperty({ description: 'False excludes the item from this channel' })
  @IsBoolean()
  sellsHere: boolean;
}
