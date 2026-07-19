import { IsUUID } from 'class-validator';
import { AddPartyAddressDto } from './add-party-address.dto';

export class AddCompanyAddressDto extends AddPartyAddressDto {
  @IsUUID()
  companyId: string;
}
