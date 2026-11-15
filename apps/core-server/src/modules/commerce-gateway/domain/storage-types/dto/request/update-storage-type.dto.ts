import { PartialType } from '@nestjs/swagger';
import { CreateStorageTypeDto } from './create-storage-type.dto';

export class UpdateStorageTypeDto extends PartialType(CreateStorageTypeDto) {}
