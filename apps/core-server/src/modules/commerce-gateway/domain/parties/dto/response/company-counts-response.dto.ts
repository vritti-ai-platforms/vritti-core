import { ApiProperty } from '@nestjs/swagger';

export class CompanyCountsResponseDto {
  @ApiProperty({ description: 'Addresses recorded for the company', example: 2 })
  addressCount: number;

  @ApiProperty({ description: 'Contactable communications (email, phone and the like) of the company', example: 3 })
  communicationCount: number;

  @ApiProperty({ description: 'Social and web profiles of the company', example: 1 })
  socialProfileCount: number;

  @ApiProperty({ description: 'People linked to the company', example: 4 })
  personCount: number;

  @ApiProperty({ description: 'Tax registrations of the company, inactive ones included', example: 2 })
  registrationCount: number;

  @ApiProperty({ description: 'Regulatory licenses of the company', example: 1 })
  licenseCount: number;

  @ApiProperty({ description: 'Bank accounts of the company', example: 1 })
  bankAccountCount: number;

  @ApiProperty({ description: 'Identifiers (CIN, LEI, DUNS and the like) of the company', example: 2 })
  identifierCount: number;
}
