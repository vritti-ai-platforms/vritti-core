import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePersonDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  firstName?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  lastName?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Primary email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Primary phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Whether the person is selectable' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
