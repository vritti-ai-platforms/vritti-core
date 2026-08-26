import { Trim } from '@vritti/api-sdk/decorators';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

// Sends a real template message — the sender is one of the WABA's registered phone numbers, and
// Meta addresses the template by name + language (not template ID)
export class SendWhatsappTemplateTestDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  senderPhoneNumberId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  to: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  language: string;

  // AUTHENTICATION templates need the code repeated as the copy-code button's URL parameter
  @IsOptional()
  @IsString()
  category?: string;

  // One value per {{n}} body variable, in order
  @IsOptional()
  @IsArray()
  bodyParams?: string[];
}
