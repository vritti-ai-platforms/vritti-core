import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddCompanyPersonDto {
  @ApiProperty({ description: 'The person (PERSON party) to link to the company' })
  @IsUUID()
  childPartyId: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Job title of the person at the company' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Secondary phone number for this relationship' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  secondaryPhone?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Secondary email for this relationship' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  secondaryEmail?: string | null;

  @ApiPropertyOptional({ description: 'Whether this is the primary person' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
