import { Module } from '@nestjs/common';
import { VerificationDomainRepository } from './repositories/verification.repository';

@Module({
  providers: [VerificationDomainRepository],
  exports: [VerificationDomainRepository],
})
export class VerificationDomainModule {}
