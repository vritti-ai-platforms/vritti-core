import { IsUUID } from 'class-validator';
import { UpdatePartyAddressDto } from './update-party-address.dto';

export class UpdateAddressDto extends UpdatePartyAddressDto {
  @IsUUID('7')
  id: string;
}
