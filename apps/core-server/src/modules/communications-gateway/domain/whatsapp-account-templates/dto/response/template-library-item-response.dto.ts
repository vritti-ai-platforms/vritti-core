import { ApiProperty } from '@nestjs/swagger';

export class TemplateLibraryItemResponseDto {
  @ApiProperty({ description: 'Meta library template ID' })
  id: string;

  @ApiProperty({ example: 'delivery_update_1' })
  name: string;

  @ApiProperty({ nullable: true, example: 'en' })
  language: string | null;

  @ApiProperty({ nullable: true, example: 'UTILITY' })
  category: string | null;

  @ApiProperty({ nullable: true, example: 'ORDER_MANAGEMENT' })
  topic: string | null;

  @ApiProperty({ nullable: true, example: 'DELIVERY_UPDATES' })
  usecase: string | null;

  @ApiProperty({ type: [String] })
  industry: string[];

  @ApiProperty({ nullable: true, description: 'Header text, when the template has one' })
  header: string | null;

  @ApiProperty({ nullable: true, description: 'Body text with {{n}} variables' })
  body: string | null;

  @ApiProperty({ type: [String], description: 'Example values for the body variables' })
  bodyParams: string[];

  @ApiProperty({ description: 'Button definitions, when the template has them' })
  buttons: Record<string, unknown>[];
}
