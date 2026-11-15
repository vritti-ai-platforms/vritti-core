import { AddInboundDeliveryLineDto } from '@commerce/inbound-deliveries/dto/request/add-inbound-delivery-lines.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateLegInboundDeliveryDto {
  @ApiProperty({ description: 'Date the goods are expected at the site (YYYY-MM-DD)', example: '2026-11-15' })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'expectedDeliveryDate must be YYYY-MM-DD' })
  expectedDeliveryDate: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Carrier bringing the goods', nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrier?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: "Carrier's tracking number", nullable: true, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  trackingNumber?: string | null;

  @Trim()
  @ApiPropertyOptional({
    description: "Number on the supplier's delivery note (challan)",
    nullable: true,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  supplierDeliveryNoteNumber?: string | null;

  @ApiPropertyOptional({ description: "Date on the supplier's delivery note (YYYY-MM-DD)", nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'supplierDeliveryNoteDate must be YYYY-MM-DD' })
  supplierDeliveryNoteDate?: string | null;

  @ApiProperty({
    type: [AddInboundDeliveryLineDto],
    description: "The leg's confirmed purchase order lines delivered, each within its open quantity",
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique((line: AddInboundDeliveryLineDto) => line.purchaseOrderItemId)
  @ValidateNested({ each: true })
  @Type(() => AddInboundDeliveryLineDto)
  lines: AddInboundDeliveryLineDto[];
}
