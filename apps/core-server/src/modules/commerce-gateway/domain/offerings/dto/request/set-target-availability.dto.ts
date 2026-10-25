import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetTargetAvailabilityDto {
  @ApiProperty({
    description: 'False makes the variant unavailable on this channel outright; true makes it available again',
  })
  @IsBoolean()
  availableHere: boolean;
}
