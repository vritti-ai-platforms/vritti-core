import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MobileAuthUserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiProperty() status: string;
  @ApiProperty() hasPassword: boolean;
  @ApiProperty() createdAt: string;
  @ApiPropertyOptional() lastLoginAt: string | null;
}

export class MobileAuthResponseDto {
  @ApiPropertyOptional() accessToken?: string;
  @ApiPropertyOptional() refreshToken?: string;
  @ApiPropertyOptional() expiresIn?: number;
  @ApiPropertyOptional() isAuthenticated?: boolean;
  @ApiPropertyOptional({ type: MobileAuthUserDto }) user?: MobileAuthUserDto;

  constructor(partial: Partial<MobileAuthResponseDto>) {
    Object.assign(this, partial);
  }
}
