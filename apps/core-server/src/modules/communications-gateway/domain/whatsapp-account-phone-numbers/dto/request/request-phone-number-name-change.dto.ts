import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RequestPhoneNumberNameChangeDto {
  @ApiProperty({
    description: 'New display name — reviewed by Meta against its display name policy',
    example: 'Vritti AI',
  })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(3)
  @MaxLength(75)
  newDisplayName: string;
}
