import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class TargetKindQueryDto {
  @ApiProperty({ enum: ['APP', 'TERMINAL'], description: 'Whether the target is an app or a till' })
  @IsIn(['APP', 'TERMINAL'])
  targetKind: 'APP' | 'TERMINAL';
}
