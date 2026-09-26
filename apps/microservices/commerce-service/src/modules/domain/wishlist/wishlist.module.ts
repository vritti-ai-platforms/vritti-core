import { Module } from '@nestjs/common';
import { WishlistDomainRepository } from './repositories/wishlist.repository';
import { WishlistDomainService } from './services/wishlist.service';

@Module({
  providers: [WishlistDomainService, WishlistDomainRepository],
  exports: [WishlistDomainService, WishlistDomainRepository],
})
export class WishlistDomainModule {}
