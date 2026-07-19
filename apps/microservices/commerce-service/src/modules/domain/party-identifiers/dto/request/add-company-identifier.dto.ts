import { IsUUID } from 'class-validator';
import { AddPartyIdentifierDto } from './add-party-identifier.dto';

export class AddCompanyIdentifierDto extends AddPartyIdentifierDto {
  @IsUUID()
  companyId: string;
}
