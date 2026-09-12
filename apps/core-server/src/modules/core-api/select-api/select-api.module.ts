import { Module } from '@nestjs/common';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { CoreSelectApiController } from './select-api.controller';

@Module({
  imports: [AppDomainModule],
  controllers: [CoreSelectApiController],
})
export class CoreSelectApiModule {}
