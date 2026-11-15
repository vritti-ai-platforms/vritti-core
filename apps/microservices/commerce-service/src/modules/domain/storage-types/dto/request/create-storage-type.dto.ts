import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { StorageTypeFieldsDto } from './storage-type-fields.dto';

export class CreateStorageTypeDto extends StorageTypeFieldsDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
