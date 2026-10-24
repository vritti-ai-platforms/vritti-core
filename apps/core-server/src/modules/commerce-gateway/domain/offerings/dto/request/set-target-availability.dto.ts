import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn } from 'class-validator';

export class SetTargetAvailabilityDto {
  @ApiProperty({ enum: ['APP', 'TERMINAL'], description: 'Whether the target is an app or a till' })
  @IsIn(['APP', 'TERMINAL'])
  targetKind: 'APP' | 'TERMINAL';

  @ApiProperty({
    description: 'False makes the variant unavailable on this channel outright; true makes it available again',
  })
  @IsBoolean()
  availableHere: boolean;
}
