import { Module } from '@nestjs/common';
import { OrganizationDomainModule } from '../organization/organization.module';
import { SessionDomainModule } from '../session/session.module';
import { UserDomainRepository } from './repositories/user.repository';
import { UserDomainService } from './services/user.service';

@Module({
  imports: [SessionDomainModule, OrganizationDomainModule],
  providers: [UserDomainService, UserDomainRepository],
  exports: [UserDomainService, UserDomainRepository],
})
export class UserDomainModule {}
