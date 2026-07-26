import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Customer name', example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @Trim({ nullify: false })
  @ApiProperty({ description: 'Customer phone number', example: '+919876543210' })
  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(32)
  @Matches(/^[+0-9()\-\s]+$/, {
    message: 'Phone must contain only digits, spaces, parentheses, dashes, or a leading +.',
  })
  phone: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Customer email address', example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
