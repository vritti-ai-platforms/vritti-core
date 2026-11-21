import { ApiProperty } from '@nestjs/swagger';

export class CreatedPosTerminalResponseDto {
  @ApiProperty({ description: 'The new POS terminal' })
  id: string;

  @ApiProperty({ description: 'Its code' })
  code: string;
}
