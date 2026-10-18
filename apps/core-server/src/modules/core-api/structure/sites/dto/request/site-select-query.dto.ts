import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class SiteSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    description: 'Only sites belonging to this legal entity. Omit for every site in the organization.',
  })
  @IsOptional()
  @IsUUID('7')
  legalEntityId?: string;
}
