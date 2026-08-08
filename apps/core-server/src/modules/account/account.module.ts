import { MediaDomainModule } from '@domain/media/media.module';
import { SessionDomainModule } from '@domain/session/session.module';
import { UserDomainModule } from '@domain/user/user.module';
import { Module } from '@nestjs/common';
import { ProfileController } from './profile/controllers/profile.controller';
import { ProfileResolver } from './profile/resolvers/profile.resolver';
import { ProfileService } from './profile/services/profile.service';
import { SecurityController } from './security/controllers/security.controller';
import { SecurityResolver } from './security/resolvers/security.resolver';
import { SecurityService } from './security/services/security.service';

@Module({
  imports: [UserDomainModule, SessionDomainModule, MediaDomainModule],
  controllers: [ProfileController, SecurityController],
  providers: [ProfileService, ProfileResolver, SecurityService, SecurityResolver],
})
export class AccountModule {}
