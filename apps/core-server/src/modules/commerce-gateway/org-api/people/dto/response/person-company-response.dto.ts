import { ApiProperty } from '@nestjs/swagger';

export class PersonCompanyResponseDto {
  @ApiProperty({ description: 'Person-company link ID' })
  id: string;

  @ApiProperty({ description: 'The company ID the person is linked to' })
  companyId: string;

  @ApiProperty({ description: 'The company name' })
  companyName: string;

  @ApiProperty({ description: 'The job title of the person at the company' })
  jobTitle: string;

  @ApiProperty({ description: 'Whether this is the primary company' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether the link is active' })
  isActive: boolean;
}
