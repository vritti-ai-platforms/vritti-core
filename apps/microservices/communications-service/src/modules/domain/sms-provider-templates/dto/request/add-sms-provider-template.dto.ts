import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddSmsProviderTemplateDto {
  // MSG91's own identifier, copied from its panel. Opaque string, not a UUID.
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  templateId: string;

  // What this template is called in Vritti. Ours, not the vendor's — `getVersions` publishes no
  // response schema, so no field of it can be trusted to name a row.
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
