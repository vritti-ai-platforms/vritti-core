import { Module } from '@nestjs/common';
import { TaxRegistrationsDomainRepository } from './repositories/tax-registrations.repository';
import { TaxRegistrationsDomainService } from './services/tax-registrations.service';

@Module({
  providers: [TaxRegistrationsDomainService, TaxRegistrationsDomainRepository],
  exports: [TaxRegistrationsDomainService, TaxRegistrationsDomainRepository],
})
export class TaxRegistrationsDomainModule {}
