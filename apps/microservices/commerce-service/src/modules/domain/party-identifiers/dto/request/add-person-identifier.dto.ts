import { IsUUID } from 'class-validator';
import { AddPartyIdentifierDto } from './add-party-identifier.dto';

export class AddPersonIdentifierDto extends AddPartyIdentifierDto {
  @IsUUID('7')
  personId: string;
}
