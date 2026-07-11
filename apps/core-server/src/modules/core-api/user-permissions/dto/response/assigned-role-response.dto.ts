import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignedRoleResponseDto {
  @ApiProperty({ example: 'store-manager' })
  roleCode: string;
  @ApiProperty({ example: 'Store Manager' })
  roleName: string;
  @ApiProperty({ example: 'SITE', enum: ['SITE', 'SITE_GROUP', 'LE', 'ORG'] })
  targetType: 'SITE' | 'SITE_GROUP' | 'LE' | 'ORG';
  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  targetId: string | null;
}
