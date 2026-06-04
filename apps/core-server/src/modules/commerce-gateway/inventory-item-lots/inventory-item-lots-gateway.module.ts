import { Module } from '@nestjs/common';
import { InventoryItemLotsGatewayController } from './inventory-item-lots-gateway.controller';
import { InventoryItemLotsGatewayService } from './services/inventory-item-lots-gateway.service';

@Module({
  controllers: [InventoryItemLotsGatewayController],
  providers: [InventoryItemLotsGatewayService],
})
export class InventoryItemLotsGatewayModule {}
