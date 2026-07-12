import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Target order status',
    example: 'ACCEPTED',
    enum: ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'],
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({ description: 'Reason for cancellation (required when cancelling)' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
