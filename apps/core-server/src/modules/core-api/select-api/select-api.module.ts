import { UserDomainModule } from '@domain/user/user.module';
import { Module } from '@nestjs/common';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { SiteDomainModule } from '@/modules/domain/site/site.module';
import { CoreSelectApiController } from './select-api.controller';
import { CoreSelectApiResolver } from './select-api.resolver';

@Module({
  imports: [AppDomainModule, UserDomainModule, SiteDomainModule],
  controllers: [CoreSelectApiController],
  providers: [CoreSelectApiResolver],
})
export class CoreSelectApiModule {}
