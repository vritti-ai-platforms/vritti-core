import { Module } from '@nestjs/common';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { AppController } from './controllers/app.controller';

@Module({
  imports: [AppDomainModule],
  controllers: [AppController],
})
export class AppApiModule {}
