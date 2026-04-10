import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStockTransferStatusDto {
  @ApiProperty({ description: 'New transfer status', example: 'IN_TRANSIT' })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ description: 'User ID who received the transfer' })
  @IsOptional()
  @IsUUID()
  receivedBy?: string;
}
