import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AgentSignatureGuard } from './guards/agent-signature.guard';
import { CloudSignatureGuard } from './guards/cloud-signature.guard';
import { OrgScopeInterceptor } from './interceptors/org-scope.interceptor';
import { RlsInterceptor } from './interceptors/rls.interceptor';

@Global()
@Module({
  providers: [
    CloudSignatureGuard,
    AgentSignatureGuard,
    OrgScopeInterceptor,
    RlsInterceptor,
    // RLS runs on every request — bind it globally here so the concern stays fully owned by this module
    { provide: APP_INTERCEPTOR, useExisting: RlsInterceptor },
  ],
  exports: [CloudSignatureGuard, AgentSignatureGuard, OrgScopeInterceptor, RlsInterceptor],
})
export class SecurityModule {}
