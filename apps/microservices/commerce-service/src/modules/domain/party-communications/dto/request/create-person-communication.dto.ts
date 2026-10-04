import { IsUUID } from 'class-validator';
import { PartyCommunicationInputDto } from './party-communication-input.dto';

export class CreatePersonCommunicationDto extends PartyCommunicationInputDto {
  @IsUUID('7')
  personId: string;
}
