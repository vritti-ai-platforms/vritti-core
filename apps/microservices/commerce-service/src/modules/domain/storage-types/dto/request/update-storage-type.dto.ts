import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { StorageTypeFieldsDto } from './storage-type-fields.dto';

export class UpdateStorageTypeDto extends StorageTypeFieldsDto {
  @IsUUID('7')
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code?: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;
}
