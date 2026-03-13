import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiProperty() role: string;
  @ApiProperty() status: string;
  @ApiProperty() hasPassword: boolean;
  @ApiProperty() createdAt: string;
  @ApiPropertyOptional() lastLoginAt: string | null;
}

export class AuthResponseDto {
  @ApiPropertyOptional() accessToken?: string;
  @ApiPropertyOptional() expiresIn?: number;
  @ApiPropertyOptional() requiresSetPassword?: boolean;
  @ApiPropertyOptional() isAuthenticated?: boolean;
  @ApiPropertyOptional({ type: AuthUserDto }) user?: AuthUserDto;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
