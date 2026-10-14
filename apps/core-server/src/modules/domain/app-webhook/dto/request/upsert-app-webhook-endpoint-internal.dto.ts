import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsBoolean, IsIn, IsString, IsUrl, MaxLength } from 'class-validator';
import { PAYMENT_WEBHOOK_EVENT_TYPES } from '@/db/schema';

export class UpsertAppWebhookEndpointInternalDto {
  @ApiProperty({
    description: 'HTTPS URL the events are POSTed to',
    example: 'https://shop.example.com/webhooks/vritti',
  })
  @IsString()
  @MaxLength(2000)
  @IsUrl(
    { protocols: ['https'], require_protocol: true, require_tld: true, allow_underscores: false },
    { message: 'url must be a public https URL' },
  )
  url: string;

  @ApiProperty({ enum: PAYMENT_WEBHOOK_EVENT_TYPES, isArray: true, example: [...PAYMENT_WEBHOOK_EVENT_TYPES] })
  @IsArray()
  @ArrayUnique()
  @IsIn(PAYMENT_WEBHOOK_EVENT_TYPES, { each: true })
  events: string[];

  @ApiProperty({ example: true })
  @IsBoolean()
  isActive: boolean;
}
