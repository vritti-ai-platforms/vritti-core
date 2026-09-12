import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

const FULFILMENT_TYPES = ['STOCK', 'ASSEMBLY', 'COMPOSITE', 'SERVICE'] as const;

export class CreateOfferingDto {
  @Trim({ nullify: false })
  @ApiProperty({ description: 'Stable identifier; every variant SKU is built from it', example: 'tshirt-classic' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Trim({ nullify: false })
  @ApiProperty({ example: 'Classic Cotton T-Shirt' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Trim()
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiProperty({ enum: FULFILMENT_TYPES, description: 'What happens at picking — decides the bill of materials rules' })
  @IsEnum(FULFILMENT_TYPES)
  fulfilmentType: (typeof FULFILMENT_TYPES)[number];

  @ApiProperty({ description: 'What this product IS for tax purposes. The rate resolves at transaction time.' })
  @IsUUID()
  taxClassId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
