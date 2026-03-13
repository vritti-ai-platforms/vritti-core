import { Module } from '@nestjs/common';
import { VerificationRepository } from './repositories/verification.repository';

@Module({
  providers: [VerificationRepository],
  exports: [VerificationRepository],
})
export class VerificationModule {}
