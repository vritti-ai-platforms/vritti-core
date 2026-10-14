import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * The site select query — the standard select options plus an optional legal entity to narrow to.
 *
 * Its own DTO rather than a field on `OrgStructureSelectQueryDto`: a legal entity filter means nothing
 * when listing legal entities or site groups, and an option nobody can use is one every reader of that
 * shared DTO has to rule out.
 */
export class SiteSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    description: 'Only sites belonging to this legal entity. Omit for every site in the organization.',
  })
  @IsOptional()
  @IsUUID('7')
  legalEntityId?: string;
}
