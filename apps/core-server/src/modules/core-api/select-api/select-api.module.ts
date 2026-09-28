import { UserDomainModule } from '@domain/user/user.module';
import { Module } from '@nestjs/common';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { CoreSelectApiController } from './select-api.controller';
import { CoreSelectApiResolver } from './select-api.resolver';

@Module({
  imports: [AppDomainModule, UserDomainModule],
  controllers: [CoreSelectApiController],
  providers: [CoreSelectApiResolver],
})
export class CoreSelectApiModule {}
