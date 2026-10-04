import { IsUUID } from 'class-validator';
import { UpdatePartyAddressDto } from './update-party-address.dto';

export class UpdatePersonAddressDto extends UpdatePartyAddressDto {
  @IsUUID('7')
  id: string;
}
