import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Creating a person through the app-facing REST surface.
 *
 * Narrower than the staff `CreatePersonDto` on purpose: the tax identifier and the
 * address are staff-curated data, so an app credential has no business setting them.
 *
 * `email` and `phone` become the party's **primary** EMAIL and PHONE communications,
 * written in the same transaction as the party itself.
 */
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
