import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// Profile-editable fields for the PUT /account/profile endpoint
export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'The full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'The display name of the user',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'The locale/language preference of the user',
    example: 'en-US',
  })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({
    description: 'The timezone preference of the user',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}
