import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { CategoryGatewayController } from './catalog/controllers/category-gateway.controller';
import { ProductGatewayController } from './catalog/controllers/product-gateway.controller';
import { CategoryGatewayService } from './catalog/services/category-gateway.service';
import { ProductGatewayService } from './catalog/services/product-gateway.service';
import { CommerceClientModule } from './commerce-client.module';
import { InvoiceGatewayController } from './invoicing/controllers/invoice-gateway.controller';
import { InvoiceGatewayService } from './invoicing/services/invoice-gateway.service';
import { KotGatewayController } from './orders/controllers/kot-gateway.controller';
import { OrderGatewayController } from './orders/controllers/order-gateway.controller';
import { StationGatewayController } from './orders/controllers/station-gateway.controller';
import { KotGatewayService } from './orders/services/kot-gateway.service';
import { OrderGatewayService } from './orders/services/order-gateway.service';
import { StationGatewayService } from './orders/services/station-gateway.service';

@Module({
  imports: [CommerceClientModule, UserModule],
  controllers: [
    // Catalog
    CategoryGatewayController,
    ProductGatewayController,
    // Orders
    StationGatewayController,
    OrderGatewayController,
    KotGatewayController,
    // Invoicing
    InvoiceGatewayController,
  ],
  providers: [
    // Catalog
    CategoryGatewayService,
    ProductGatewayService,
    // Orders
    StationGatewayService,
    OrderGatewayService,
    KotGatewayService,
    // Invoicing
    InvoiceGatewayService,
  ],
})
export class CommerceGatewayModule {}
