import { ApiProperty } from '@nestjs/swagger';

export class CreatedLocationResponseDto {
  @ApiProperty({ description: 'The new location' })
  id: string;

  @ApiProperty({ description: 'Its code' })
  code: string;
}
