import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadMediaQueryDto {
  @ApiProperty({ description: 'Entity kind the file belongs to', example: 'product' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ description: 'Identifier of the entity the file belongs to' })
  @IsString()
  @IsNotEmpty()
  entityId: string;
}
