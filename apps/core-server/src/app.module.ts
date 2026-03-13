import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import * as schema from '@/db/schema';
import { relations } from '@/db/schema';

import './db/schema.registry';

import {
  AuthConfigModule,
  DatabaseModule,
  type DatabaseModuleOptions,
  EmailModule,
  LoggerModule,
  RootModule,
} from '@vritti/api-sdk';
import { validate } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { UserModule } from './modules/user/user.module';
import { VerificationModule } from './modules/verification/verification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    // Event emitter for real-time updates
    EventEmitterModule.forRoot(),
    // Logger module
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          environment: configService.getOrThrow('NODE_ENV'),
          appName: configService.getOrThrow('APP_NAME'),
          provider: configService.getOrThrow('LOG_PROVIDER'),
          level: configService.getOrThrow('LOG_LEVEL'),
          format: configService.getOrThrow('LOG_FORMAT'),
          enableFileLogger: configService.getOrThrow('LOG_TO_FILE'),
          filePath: configService.getOrThrow('LOG_FILE_PATH'),
          maxFiles: configService.getOrThrow('LOG_MAX_FILES'),

          enableHttpLogger: true,
          httpLogger: {
            enableRequestLog: true,
            enableResponseLog: true,
            slowRequestThreshold: 3000, // milliseconds
          },
        };
      },
      inject: [ConfigService],
    }),
    // Database module
    DatabaseModule.forServer({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const options: DatabaseModuleOptions = {
          primaryDb: {
            host: config.getOrThrow<string>('PRIMARY_DB_HOST'),
            port: config.get<number>('PRIMARY_DB_PORT'),
            username: config.getOrThrow<string>('PRIMARY_DB_USERNAME'),
            password: config.getOrThrow<string>('PRIMARY_DB_PASSWORD'),
            database: config.getOrThrow<string>('PRIMARY_DB_DATABASE'),
            schema: config.get<string>('PRIMARY_DB_SCHEMA'),
            sslMode: config.get<'require' | 'prefer' | 'disable' | 'no-verify'>('PRIMARY_DB_SSL_MODE'),
          },

          drizzleSchema: schema,
          // Relations must be passed separately for db.query to work (drizzle-orm v2)
          drizzleRelations: relations,

          // Connection pool configuration
          connectionCacheTTL: 300000, // 5 minutes
          maxConnections: 10,
        };
        return options;
      },
    }),
    // Authentication module (Global guard + JWT)
    // Must be imported after DatabaseModule since VrittiAuthGuard depends on its services
    AuthConfigModule.forRootAsync(),
    // Root module — health check and CSRF endpoints
    RootModule,
    // Email module — globally provided EmailService
    EmailModule,
    // Nexus API modules — routes registered at root (proxy strips /api prefix)
    AuthModule,
    UserModule,
    OrganizationModule,
    VerificationModule,
  ],
})
export class AppModule {}
