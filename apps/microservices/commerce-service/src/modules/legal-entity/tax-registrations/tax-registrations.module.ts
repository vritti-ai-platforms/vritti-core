import { TaxRegistrationsDomainModule } from '@domain/tax-registrations/tax-registrations.module';
import { Module } from '@nestjs/common';
import { TaxRegistrationsController } from './tax-registrations.controller';

@Module({
  imports: [TaxRegistrationsDomainModule],
  controllers: [TaxRegistrationsController],
})
export class LeTaxRegistrationsModule {}
