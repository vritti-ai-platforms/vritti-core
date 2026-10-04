import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class OrgStructureSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    description: 'Exclude this node and its entire descendant subtree',
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID('7')
  excludeId?: string;
}
