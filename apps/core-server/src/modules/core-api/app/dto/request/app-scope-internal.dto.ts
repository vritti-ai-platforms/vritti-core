import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/**
 * Every internal app route carries the organization, so a lookup is always
 * scoped. Matching on id alone would let one org address another org's app.
 */
export class AppScopeInternalDto {
  @ApiProperty({ description: 'Nexus organization ID' })
  @IsUUID()
  orgId: string;
}
