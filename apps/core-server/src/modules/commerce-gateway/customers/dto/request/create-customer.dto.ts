import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer name', example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Customer phone number', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(32)
  @Matches(/^[+0-9()\-\s]+$/, { message: 'Phone must contain only digits, spaces, parentheses, dashes, or a leading +.' })
  phone: string;

  @ApiPropertyOptional({ description: 'Customer email address', example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
