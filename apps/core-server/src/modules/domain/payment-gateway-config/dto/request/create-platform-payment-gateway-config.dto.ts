import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { CreatePaymentGatewayConfigDto } from './create-payment-gateway-config.dto';

export class CreatePlatformPaymentGatewayConfigDto extends CreatePaymentGatewayConfigDto {
  @ApiPropertyOptional({ description: "Vritti's fee in basis points on payments it collects", example: 150 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  platformFeeBps?: number;
}
