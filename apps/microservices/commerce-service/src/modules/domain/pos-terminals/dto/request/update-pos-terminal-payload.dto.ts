import { UpdatePosTerminalDto } from '@domain/pos-terminals/dto/request/update-pos-terminal.dto';
import { IsUUID } from 'class-validator';

export class UpdatePosTerminalPayloadDto extends UpdatePosTerminalDto {
  @IsUUID()
  id: string;
}
