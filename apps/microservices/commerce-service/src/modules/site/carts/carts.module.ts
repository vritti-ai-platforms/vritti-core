import { CartsDomainModule } from '@domain/carts/carts.module';
import { Module } from '@nestjs/common';
import { CartsController } from './carts.controller';

@Module({
  imports: [CartsDomainModule],
  controllers: [CartsController],
})
export class SiteCartsModule {}
