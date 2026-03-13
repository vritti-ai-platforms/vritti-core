import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetUsersWebhookDto {
  @ApiProperty({ description: 'Organisation ID to fetch users for', example: 'uuid-here' })
  @IsUUID()
  orgId: string;
}
