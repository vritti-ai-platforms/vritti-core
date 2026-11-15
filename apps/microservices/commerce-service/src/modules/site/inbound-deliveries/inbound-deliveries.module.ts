import { InboundDeliveriesDomainModule } from '@domain/inbound-deliveries/inbound-deliveries.module';
import { PurchasesDomainModule } from '@domain/purchases/purchases.module';
import { SupplierEnrollmentsDomainModule } from '@domain/supplier-enrollments/supplier-enrollments.module';
import { Module } from '@nestjs/common';
import { InboundDeliveriesLinesController } from './lines/inbound-deliveries-lines.controller';
import { InboundDeliveriesLinesService } from './lines/services/inbound-deliveries-lines.service';
import { InboundDeliveriesRootController } from './root/inbound-deliveries-root.controller';
import { InboundDeliveriesService } from './root/services/inbound-deliveries-root.service';

@Module({
  imports: [InboundDeliveriesDomainModule, SupplierEnrollmentsDomainModule, PurchasesDomainModule],
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
