import { ConversionsDomainModule } from '@domain/conversions/conversions.module';
import { Module } from '@nestjs/common';
import { ConversionsController } from './conversions.controller';

@Module({
  imports: [ConversionsDomainModule],
  controllers: [ConversionsController],
})
export class ConversionsModule {}
