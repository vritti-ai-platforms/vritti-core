import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { AssignmentTypeValues } from '@/db/schema';

export class AssignRoleWebhookDto {
  @ApiProperty({ description: 'Organization role ID', example: 'uuid-here' })
  @IsUUID()
  orgRoleId: string;

  @ApiProperty({ description: 'Business unit ID', example: 'uuid-here' })
  @IsUUID()
  businessUnitId: string;

  @ApiPropertyOptional({
    description: 'Assignment type',
    enum: ['DIRECT', 'INHERITED'],
    example: 'DIRECT',
  })
  @IsOptional()
  @IsEnum(AssignmentTypeValues)
  assignmentType?: string;
}
