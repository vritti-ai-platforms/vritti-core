import { IsUUID } from 'class-validator';
import { UpdateLocationDto } from './update-location.dto';

export class UpdateLocationPayloadDto extends UpdateLocationDto {
  @IsUUID()
  id: string;
}
