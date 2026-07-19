import { IsUUID } from 'class-validator';
import { AddPartyAddressDto } from './add-party-address.dto';

export class AddPersonAddressDto extends AddPartyAddressDto {
  @IsUUID()
  personId: string;
}
