import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLeTaxRegistrationInternalDto {
  @ApiProperty({ description: 'Tax registration number (GSTIN, TRN, VAT number)', example: '29AAACA1234F1Z5' })
  @IsString()
  @IsNotEmpty()
  taxNumber: string;

  @ApiPropertyOptional({ description: 'Registration region (state or country)', example: 'Karnataka' })
  @IsOptional()
  @IsString()
  region?: string;
}
