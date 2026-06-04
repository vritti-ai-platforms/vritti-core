import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MobileRefreshDto {
  @ApiProperty({ description: 'Refresh token from previous login or refresh response' })
  @IsString()
  refreshToken: string;
}
