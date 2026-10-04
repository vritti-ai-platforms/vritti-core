import { IsUUID } from 'class-validator';
import { SocialProfileInputDto } from './social-profile-input.dto';

export class CreateCompanySocialProfileDto extends SocialProfileInputDto {
  @IsUUID('7')
  companyId: string;
}
