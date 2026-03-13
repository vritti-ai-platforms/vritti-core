import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule, jwtConfigFactory } from '@vritti/api-sdk';
import { UserModule } from '../user/user.module';
import { VerificationModule } from '../verification/verification.module';
import { ForgotPasswordController } from './forgot-password/controllers/forgot-password.controller';
import { PasswordResetService } from './forgot-password/services/password-reset.service';
import { AuthController } from './root/controllers/auth.controller';
import { SessionRepository } from './root/repositories/session.repository';
import { AuthService } from './root/services/auth.service';
import { SessionService } from './root/services/session.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: jwtConfigFactory,
    }),
    EmailModule,
    forwardRef(() => UserModule),
    VerificationModule,
  ],
  controllers: [AuthController, ForgotPasswordController],
  providers: [
    // Root
    AuthService,
    SessionService,
    SessionRepository,
    // Forgot password
    PasswordResetService,
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
