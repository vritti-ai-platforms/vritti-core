import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetRegistrationActiveDto {
  @ApiProperty({
    description: 'Active registrations can be picked for a supplier site enrollment; the primary must stay active',
  })
  @IsBoolean()
  isActive: boolean;
}
