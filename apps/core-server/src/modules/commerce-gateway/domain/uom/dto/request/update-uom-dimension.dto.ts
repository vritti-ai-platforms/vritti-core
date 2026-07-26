import { PartialType } from '@nestjs/swagger';
import { CreateUomDimensionDto } from './create-uom-dimension.dto';

export class UpdateUomDimensionDto extends PartialType(CreateUomDimensionDto) {}
