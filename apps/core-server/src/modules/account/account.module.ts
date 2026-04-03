import { Module } from '@nestjs/common';
import { UserDomainModule } from '@domain/user/user.module';
import { ProfileController } from './profile/controllers/profile.controller';
import { ProfileService } from './profile/services/profile.service';

@Module({
  imports: [UserDomainModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class AccountModule {}
