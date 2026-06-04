import { Module } from '@nestjs/common';
import { OrganizationDomainModule } from '../organization/organization.module';
import { SessionDomainModule } from '../session/session.module';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';

@Module({
  imports: [SessionDomainModule, OrganizationDomainModule],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserDomainModule {}
