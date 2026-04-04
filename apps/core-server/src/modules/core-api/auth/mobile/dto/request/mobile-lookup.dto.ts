import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class MobileLookupDto {
  @ApiProperty({
    description: 'User email address to look up organizations for',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;
}
