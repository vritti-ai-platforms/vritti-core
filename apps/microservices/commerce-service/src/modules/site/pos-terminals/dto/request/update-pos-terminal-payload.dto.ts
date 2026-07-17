import { IsUUID } from 'class-validator';
import { UpdatePosTerminalDto } from './update-pos-terminal.dto';

export class UpdatePosTerminalPayloadDto extends UpdatePosTerminalDto {
  @IsUUID()
  id: string;
}
