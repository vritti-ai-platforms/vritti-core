import type { CompanyCounts } from '../../repositories/parties.repository';

export class CompanyCountsDto {
  addressCount: number;
  communicationCount: number;
  socialProfileCount: number;
  personCount: number;
  registrationCount: number;
  licenseCount: number;
  bankAccountCount: number;
  identifierCount: number;

  // Shapes how many rows each tab of a company's detail page lists
  static from(row: CompanyCounts): CompanyCountsDto {
    const dto = new CompanyCountsDto();
    dto.addressCount = row.addressCount;
    dto.communicationCount = row.communicationCount;
    dto.socialProfileCount = row.socialProfileCount;
    dto.personCount = row.personCount;
    dto.registrationCount = row.registrationCount;
    dto.licenseCount = row.licenseCount;
    dto.bankAccountCount = row.bankAccountCount;
    dto.identifierCount = row.identifierCount;
    return dto;
  }
}
