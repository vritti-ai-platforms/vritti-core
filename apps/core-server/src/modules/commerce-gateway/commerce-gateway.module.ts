import { Module } from '@nestjs/common';
import { UserDomainModule } from '@domain/user/user.module';
import { CategoriesGatewayController } from './categories/categories-gateway.controller';
import { CategoriesGatewayService } from './categories/services/categories-gateway.service';
import { CommerceClientModule } from './commerce-client.module';

@Module({
  imports: [CommerceClientModule, UserDomainModule],
  controllers: [CategoriesGatewayController],
  providers: [CategoriesGatewayService],
})
export class CommerceGatewayModule {}
