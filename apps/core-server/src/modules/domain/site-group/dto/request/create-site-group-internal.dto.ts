import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSiteGroupInternalDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ description: 'Site group name', example: 'South Zone' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Site group code (unique per organization)', example: 'south-zone' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Parent site group ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
