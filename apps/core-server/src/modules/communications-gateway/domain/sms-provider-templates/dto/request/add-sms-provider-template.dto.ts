import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddSmsProviderTemplateDto {
  @ApiProperty({
    example: '68b3f2a17c1e4a0f9c2b1d34',
    description: "MSG91's own template ID, copied from its panel. An opaque string, not a UUID.",
  })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  templateId: string;

  @ApiProperty({ example: 'Sign-in code', description: 'What this template is called in Vritti' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
