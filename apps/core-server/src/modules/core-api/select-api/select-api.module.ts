import { UserDomainModule } from '@domain/user/user.module';
import { Module } from '@nestjs/common';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { SiteDomainModule } from '@/modules/domain/site/site.module';
import { CoreSelectApiController } from './select-api.controller';
import { CoreSelectApiResolver } from './select-api.resolver';
import { SiteSelectApiService } from './services/site-select-api.service';

@Module({
  imports: [AppDomainModule, UserDomainModule, SiteDomainModule],
  controllers: [CoreSelectApiController],
  providers: [CoreSelectApiResolver, SiteSelectApiService],
})
export class CoreSelectApiModule {}
