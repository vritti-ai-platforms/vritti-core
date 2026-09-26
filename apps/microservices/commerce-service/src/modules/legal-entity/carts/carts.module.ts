import { CartsDomainModule } from '@domain/carts/carts.module';
import { Module } from '@nestjs/common';
import { LeCartsController } from './carts.controller';

@Module({
  imports: [CartsDomainModule],
  controllers: [LeCartsController],
})
export class LeCartsModule {}
