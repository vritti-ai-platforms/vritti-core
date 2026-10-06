import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePersonAppDto {
  @ApiProperty({ description: 'Given name', example: 'Ramesh' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @ApiPropertyOptional({ description: 'Family name', example: 'Kumar' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  lastName?: string | null;

  @ApiPropertyOptional({ description: 'Becomes the primary EMAIL communication', example: 'ramesh@example.com' })
  @IsOptional()
  @Trim()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional({ description: 'Becomes the primary PHONE communication', example: '+919876543210' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(20)
  phone?: string | null;
}
