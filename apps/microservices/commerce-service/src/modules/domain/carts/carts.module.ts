import { Module } from '@nestjs/common';
import { CartsDomainRepository } from './repositories/carts.repository';
import { CartsDomainService } from './services/carts.service';

@Module({
  providers: [CartsDomainService, CartsDomainRepository],
  exports: [CartsDomainService, CartsDomainRepository],
})
export class CartsDomainModule {}
