import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateUserWebhookDto {
  @ApiProperty({ description: 'Nexus organisation ID', example: 'uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  orgId: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full name', example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
