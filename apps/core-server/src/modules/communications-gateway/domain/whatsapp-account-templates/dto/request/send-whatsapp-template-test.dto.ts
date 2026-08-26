import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

// Sends a real, billable template message. The sender is one of the WABA's registered phone
// numbers, and Meta addresses the template by name + language (not template ID).
export class SendWhatsappTemplateTestDto {
  @ApiProperty({ description: 'Meta phone number ID of the WABA number to send from', example: '106540352242922' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+$/, { message: 'Must be a Meta phone number ID' })
  senderPhoneNumberId: string;

  @ApiProperty({ description: 'Recipient in international format', example: '+919876543210' })
  @Trim({ nullify: false })
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Enter the number in international format, e.g. +919876543210' })
  to: string;

  @ApiProperty({ example: 'order_update' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/)
  @MaxLength(512)
  templateName: string;

  @ApiProperty({ example: 'en' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  language: string;

  @ApiPropertyOptional({
    enum: ['AUTHENTICATION', 'UTILITY', 'MARKETING'],
    description: "AUTHENTICATION templates repeat the code as the copy-code button's URL parameter",
  })
  @IsOptional()
  @IsIn(['AUTHENTICATION', 'UTILITY', 'MARKETING'])
  category?: string;

  @ApiPropertyOptional({ type: [String], description: 'One value per {{n}} body variable, in order' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(200, { each: true })
  @Type(() => String)
  bodyParams?: string[];
}
