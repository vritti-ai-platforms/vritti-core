import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePartyContactDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Contact label', example: 'Personal', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Contact person name', example: 'Priya Sharma', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Contact email', example: 'priya@example.com', nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Contact phone', example: '+91 98765 43210', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @ApiPropertyOptional({ description: 'Whether this is the primary contact for the party' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ description: 'Whether the contact is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
