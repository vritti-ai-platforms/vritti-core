import { Trim } from '@vritti/api-sdk/decorators';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export type WhatsappTemplateCategory = 'AUTHENTICATION' | 'UTILITY' | 'MARKETING';

// Components are passed through to Meta as-is — Meta is the authoritative validator of their
// internals (variable counts, button combinations, category-specific rules)
export class CreateWhatsappTemplateDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/)
  @MaxLength(512)
  name: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  language: string;

  @IsIn(['AUTHENTICATION', 'UTILITY', 'MARKETING'])
  category: WhatsappTemplateCategory;

  @IsOptional()
  @IsArray()
  components?: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  libraryTemplateName?: string;

  @IsOptional()
  @IsArray()
  libraryTemplateButtonInputs?: Record<string, unknown>[];
}
