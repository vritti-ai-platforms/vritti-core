import { ApiProperty } from '@nestjs/swagger';
import { IsCode } from '@vritti/api-sdk/decorators';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsString, MaxLength } from 'class-validator';

export class CreateStorefrontPagesDto {
  @ApiProperty({ type: [String], description: 'Variant codes to create pages for. Ones it already has are skipped.' })
  @IsArray()
  @ArrayNotEmpty()
  // Chunked downstream, but a single request still has a ceiling so one call cannot ask for a whole catalogue
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @IsCode({}, { each: true })
  variantCodes: string[];
}
