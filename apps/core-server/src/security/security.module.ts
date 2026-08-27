import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppDomainModule } from '@/modules/domain/app/app.module';
import { AgentSignatureGuard } from './guards/agent-signature.guard';
import { RlsInterceptor } from './interceptors/rls.interceptor';
import { AppRequestResolver } from './services/app-request.resolver';
import { CloudRequestResolver } from './services/cloud-request.resolver';

@Global()
@Module({
  // AppRequestResolver turns a client id into a credential row, so this module needs
  // the app domain. Imported rather than relied on globally so the dependency is
  // visible where it is created.
  imports: [AppDomainModule],
  providers: [
    AgentSignatureGuard,
    AppRequestResolver,
    CloudRequestResolver,
    RlsInterceptor,
    // RLS runs on every request — bind it globally here so the concern stays fully owned by this module
    { provide: APP_INTERCEPTOR, useExisting: RlsInterceptor },
  ],
  exports: [AgentSignatureGuard, AppRequestResolver, CloudRequestResolver, RlsInterceptor],
})
export class SecurityModule {}
