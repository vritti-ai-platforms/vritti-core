import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoleWebhookDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ example: 'Inventory Manager' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Can manage all inventory operations' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'cashier' })
  @IsOptional()
  @IsString()
  code?: string;


  @ApiProperty({ example: { products: { web: ['VIEW','CREATE'], mobile: ['VIEW'] } } })
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  features: Record<string, { app?: string; web?: string[]; mobile?: string[] }>;
}
