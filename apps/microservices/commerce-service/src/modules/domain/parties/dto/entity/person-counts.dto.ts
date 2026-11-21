import type { PersonCounts } from '../../repositories/parties.repository';

export class PersonCountsDto {
  addressCount: number;
  communicationCount: number;
  socialProfileCount: number;
  companyCount: number;
  registrationCount: number;
  licenseCount: number;
  bankAccountCount: number;
  wishlistCount: number;
  identifierCount: number;

  // Shapes how many rows each tab of a person's detail page lists
  static from(row: PersonCounts): PersonCountsDto {
    const dto = new PersonCountsDto();
    dto.addressCount = row.addressCount;
    dto.communicationCount = row.communicationCount;
    dto.socialProfileCount = row.socialProfileCount;
    dto.companyCount = row.companyCount;
    dto.registrationCount = row.registrationCount;
    dto.licenseCount = row.licenseCount;
    dto.bankAccountCount = row.bankAccountCount;
    dto.wishlistCount = row.wishlistCount;
    dto.identifierCount = row.identifierCount;
    return dto;
  }
}
