import { BomDomainModule } from '@domain/bom/bom.module';
import { Module } from '@nestjs/common';
import { BomController } from './bom.controller';

@Module({
  imports: [BomDomainModule],
  controllers: [BomController],
})
export class BomModule {}
