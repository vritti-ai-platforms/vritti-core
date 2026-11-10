import { InboundDeliveriesDomainModule } from '@domain/inbound-deliveries/inbound-deliveries.module';
import { PurchaseOrderItemsDomainModule } from '@domain/purchase-order-items/purchase-order-items.module';
import { PurchaseOrdersDomainModule } from '@domain/purchase-orders/purchase-orders.module';
import { SupplierEnrollmentsDomainModule } from '@domain/supplier-enrollments/supplier-enrollments.module';
import { Module } from '@nestjs/common';
import { SiteGoodsReceiptsModule } from '@/modules/site/goods-receipts/goods-receipts.module';
import { InboundDeliveriesLinesController } from './lines/inbound-deliveries-lines.controller';
import { InboundDeliveriesLinesService } from './lines/services/inbound-deliveries-lines.service';
import { InboundDeliveriesRootController } from './root/inbound-deliveries-root.controller';
import { InboundDeliveriesService } from './root/services/inbound-deliveries-root.service';

@Module({
  imports: [
    InboundDeliveriesDomainModule,
    PurchaseOrdersDomainModule,
    PurchaseOrderItemsDomainModule,
    SupplierEnrollmentsDomainModule,
    SiteGoodsReceiptsModule,
  ],
  controllers: [InboundDeliveriesRootController, InboundDeliveriesLinesController],
  providers: [
    // Root
    InboundDeliveriesService,
    // Lines
    InboundDeliveriesLinesService,
  ],
  exports: [InboundDeliveriesService, InboundDeliveriesLinesService],
})
export class SiteInboundDeliveriesModule {}
