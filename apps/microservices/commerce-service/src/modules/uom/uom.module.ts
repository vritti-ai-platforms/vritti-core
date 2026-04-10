import { UomDomainModule } from '@domain/uom/uom.module';
import { Module } from '@nestjs/common';
import { UomController } from './uom.controller';

@Module({
  imports: [UomDomainModule],
  controllers: [UomController],
})
export class UomModule {}
