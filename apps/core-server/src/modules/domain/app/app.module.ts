import { Module } from '@nestjs/common';
import { AppDomainRepository } from './repositories/app.repository';
import { AppDomainService } from './services/app.service';

// Owns the app credential rows
@Module({
  providers: [AppDomainService, AppDomainRepository],
  exports: [AppDomainService, AppDomainRepository],
})
export class AppDomainModule {}
