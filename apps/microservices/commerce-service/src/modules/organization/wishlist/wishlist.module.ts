import { WishlistDomainModule } from '@domain/wishlist/wishlist.module';
import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [WishlistDomainModule],
  controllers: [WishlistController],
})
export class OrgWishlistModule {}
