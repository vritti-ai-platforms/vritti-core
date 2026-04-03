import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule, jwtConfigFactory } from '@vritti/api-sdk';
import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { SessionDomainModule } from '@domain/session/session.module';
import { UserDomainModule } from '@domain/user/user.module';
import { VerificationDomainModule } from '@domain/verification/verification.module';
import { ForgotPasswordController } from './forgot-password/controllers/forgot-password.controller';
import { PasswordResetService } from './forgot-password/services/password-reset.service';
import { AuthStatusEventListener } from './root/listeners/auth-status-event.listener';
import { AuthController } from './root/controllers/auth.controller';
import { AuthService } from './root/services/auth.service';
import { AuthStatusSseService } from './root/services/auth-status-sse.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: jwtConfigFactory,
    }),
    EmailModule,
    SessionDomainModule,
    UserDomainModule,
    OrganizationDomainModule,
    VerificationDomainModule,
  ],
  controllers: [AuthController, ForgotPasswordController],
  providers: [
    // Root
    AuthService,
    AuthStatusSseService,
    AuthStatusEventListener,
    // Forgot password
    PasswordResetService,
  ],
  exports: [],
})
export class AuthApiModule {}
