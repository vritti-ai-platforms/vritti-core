import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { SessionDomainModule } from '@domain/session/session.module';
import { UserDomainModule } from '@domain/user/user.module';
import { VerificationDomainModule } from '@domain/verification/verification.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '@vritti/api-sdk';
import { ForgotPasswordController } from './forgot-password/controllers/forgot-password.controller';
import { PasswordResetService } from './forgot-password/services/password-reset.service';
import { MobileAuthController } from './mobile/controllers/mobile-auth.controller';
import { AuthController } from './root/controllers/auth.controller';
import { AuthStatusEventListener } from './root/listeners/auth-status-event.listener';
import { AuthService } from './root/services/auth.service';
import { AuthStatusSseService } from './root/services/auth-status-sse.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256' as const },
      }),
    }),
    EmailModule,
    SessionDomainModule,
    UserDomainModule,
    OrganizationDomainModule,
    VerificationDomainModule,
  ],
  controllers: [AuthController, ForgotPasswordController, MobileAuthController],
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
