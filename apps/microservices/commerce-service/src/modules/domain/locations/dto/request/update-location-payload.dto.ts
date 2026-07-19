import { UpdateLocationDto } from '@domain/locations/dto/request/update-location.dto';
import { IsUUID } from 'class-validator';

export class UpdateLocationPayloadDto extends UpdateLocationDto {
  @IsUUID()
  id: string;
}
