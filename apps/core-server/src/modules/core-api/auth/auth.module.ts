import { OrganizationDomainModule } from '@domain/organization/organization.module';
import { SessionDomainModule } from '@domain/session/session.module';
import { UserDomainModule } from '@domain/user/user.module';
import { UserPermissionsDomainModule } from '@domain/user-permissions/user-permissions.module';
import { UserRoleDomainModule } from '@domain/user-role/user-role.module';
import { VerificationDomainModule } from '@domain/verification/verification.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '@vritti/api-sdk';
import { ForgotPasswordController } from './forgot-password/controllers/forgot-password.controller';
import { PasswordResetService } from './forgot-password/services/password-reset.service';
import { AuthController } from './root/controllers/auth.controller';
import { AuthStatusEventListener } from './root/listeners/auth-status-event.listener';
import { AuthResolver } from './root/resolvers/auth.resolver';
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
    UserPermissionsDomainModule,
    UserRoleDomainModule,
    OrganizationDomainModule,
    VerificationDomainModule,
  ],
  controllers: [AuthController, ForgotPasswordController],
  providers: [
    // Root
    AuthService,
    AuthResolver,
    AuthStatusSseService,
    AuthStatusEventListener,
    // Forgot password
    PasswordResetService,
  ],
  exports: [],
})
export class AuthApiModule {}
