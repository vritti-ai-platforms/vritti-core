import { Trim } from '@vritti/api-sdk/decorators';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateTaxClassDto {
  @IsUUID('7')
  id: string;

  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;
}
