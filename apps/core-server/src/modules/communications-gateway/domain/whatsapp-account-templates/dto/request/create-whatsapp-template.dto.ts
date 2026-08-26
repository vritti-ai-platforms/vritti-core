import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf } from 'class-validator';

export class CreateWhatsappTemplateDto {
  @ApiProperty({ description: 'Template name — lowercase letters, digits, underscores', example: 'order_update' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, { message: 'Lowercase letters, digits, and underscores only' })
  @MaxLength(512)
  name: string;

  @ApiProperty({ example: 'en' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  language: string;

  @ApiProperty({ enum: ['AUTHENTICATION', 'UTILITY', 'MARKETING'] })
  @IsIn(['AUTHENTICATION', 'UTILITY', 'MARKETING'])
  category: 'AUTHENTICATION' | 'UTILITY' | 'MARKETING';

  // Custom path: Meta component objects, passed through — Meta validates their internals.
  // Exactly one of components / libraryTemplateName must be present.
  // @Type(() => Object) pins the item type: without it, enableImplicitConversion coerces each
  // nested object to the property's reflected Array type, forwarding [[],[],[]] to Meta.
  @ApiPropertyOptional({ description: 'Custom template components (header/body/footer/buttons)' })
  @ValidateIf((o: CreateWhatsappTemplateDto) => !o.libraryTemplateName)
  @IsArray()
  @Type(() => Object)
  components?: Record<string, unknown>[];

  // Library path: reference to a pre-approved Meta library template
  @ApiPropertyOptional({ example: 'order_confirmation_1' })
  @ValidateIf((o: CreateWhatsappTemplateDto) => !o.components)
  @IsString()
  @IsNotEmpty()
  libraryTemplateName?: string;

  @ApiPropertyOptional({ description: 'Button inputs (e.g. URLs) required by the chosen library template' })
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  libraryTemplateButtonInputs?: Record<string, unknown>[];
}
