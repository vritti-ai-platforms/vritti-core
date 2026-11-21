import { ApiProperty } from '@nestjs/swagger';

export class PersonCountsResponseDto {
  @ApiProperty({ description: 'Addresses recorded for the person', example: 1 })
  addressCount: number;

  @ApiProperty({ description: 'Contactable communications (email, phone and the like) of the person', example: 2 })
  communicationCount: number;

  @ApiProperty({ description: 'Social and web profiles of the person', example: 1 })
  socialProfileCount: number;

  @ApiProperty({ description: 'Companies the person is linked to', example: 1 })
  companyCount: number;

  @ApiProperty({ description: 'Tax registrations of the person, inactive ones included', example: 0 })
  registrationCount: number;

  @ApiProperty({ description: 'Regulatory licenses of the person', example: 0 })
  licenseCount: number;

  @ApiProperty({ description: 'Bank accounts of the person', example: 1 })
  bankAccountCount: number;

  @ApiProperty({ description: 'Products the person saved for later on a storefront', example: 5 })
  wishlistCount: number;

  @ApiProperty({ description: 'Identity documents of the person', example: 1 })
  identifierCount: number;
}
