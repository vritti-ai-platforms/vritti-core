import { Module } from '@nestjs/common';
import { SessionDomainModule } from '@domain/session/session.module';
import { UserDomainModule } from '@domain/user/user.module';
import { ProfileController } from './profile/controllers/profile.controller';
import { ProfileService } from './profile/services/profile.service';
import { SecurityController } from './security/controllers/security.controller';
import { SecurityService } from './security/services/security.service';

@Module({
  imports: [UserDomainModule, SessionDomainModule],
  controllers: [ProfileController, SecurityController],
  providers: [ProfileService, SecurityService],
})
export class AccountModule {}
