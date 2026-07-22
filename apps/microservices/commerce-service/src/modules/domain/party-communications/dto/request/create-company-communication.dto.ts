import { IsUUID } from 'class-validator';
import { PartyCommunicationInputDto } from './party-communication-input.dto';

export class CreateCompanyCommunicationDto extends PartyCommunicationInputDto {
  @IsUUID()
  companyId: string;
}
