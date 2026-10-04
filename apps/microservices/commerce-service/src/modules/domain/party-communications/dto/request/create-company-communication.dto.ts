import { IsUUID } from 'class-validator';
import { PartyCommunicationInputDto } from './party-communication-input.dto';

export class CreateCompanyCommunicationDto extends PartyCommunicationInputDto {
  @IsUUID('7')
  companyId: string;
}
