import { ApiProperty } from '@nestjs/swagger';
import { IsCode } from '@vritti/api-sdk/decorators';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsIn, IsString, MaxLength } from 'class-validator';

export class CreateStorefrontPagesDto {
  @ApiProperty({ enum: ['APP', 'TERMINAL'], description: 'Whether the target is an app or a till' })
  @IsIn(['APP', 'TERMINAL'])
  targetKind: 'APP' | 'TERMINAL';

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
