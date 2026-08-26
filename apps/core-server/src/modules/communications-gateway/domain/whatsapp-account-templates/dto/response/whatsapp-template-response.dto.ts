import { ApiProperty } from '@nestjs/swagger';

export class WhatsappTemplateResponseDto {
  @ApiProperty({ description: 'Meta template ID', example: '1234567890123456' })
  id: string;

  @ApiProperty({ example: 'verification_code' })
  name: string;

  @ApiProperty({ nullable: true, example: 'APPROVED', description: 'Meta review status' })
  status: string | null;

  @ApiProperty({ nullable: true, example: 'AUTHENTICATION' })
  category: string | null;

  @ApiProperty({ nullable: true, example: 'en' })
  language: string | null;

  @ApiProperty({ nullable: true, example: 'GREEN', description: 'Meta quality score' })
  qualityScore: string | null;

  @ApiProperty({ nullable: true, description: 'Reason Meta gave when the template was rejected' })
  rejectedReason: string | null;

  @ApiProperty({ nullable: true, description: 'Header text ({{n}} placeholders unrendered); null for media headers' })
  headerText: string | null;

  @ApiProperty({ nullable: true, description: 'Body text with {{n}} placeholders unrendered' })
  bodyText: string | null;

  @ApiProperty({ nullable: true })
  footerText: string | null;

  @ApiProperty({ type: [String], description: 'Button labels in display order' })
  buttons: string[];
}
