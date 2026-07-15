import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class ReparentSiteGroupInternalDto {
  @ApiProperty({
    description: 'New parent site group ID; null detaches the group to root',
    example: 'uuid-here',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.parentId !== null)
  @IsUUID()
  parentId: string | null;
}
