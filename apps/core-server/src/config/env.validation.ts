import { plainToInstance, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  USE_HTTPS: boolean;

  @IsString()
  APP_NAME: string;

  // Logging
  @IsEnum(['default', 'winston'])
  LOG_PROVIDER: string;

  @IsString()
  LOG_LEVEL: string;

  @IsString()
  LOG_FORMAT: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  LOG_TO_FILE: boolean;

  @IsString()
  LOG_FILE_PATH: string;

  @IsString()
  LOG_MAX_FILES: string;

  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  MASK_PII: boolean;

  // Security
  @IsString()
  @MinLength(32)
  COOKIE_SECRET: string;

  @IsString()
  @MinLength(32)
  HMAC_KEY: string;

  @IsNumber()
  @Min(10)
  BCRYPT_SALT_ROUNDS: number;

  // JWT
  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  ACCESS_TOKEN_EXPIRY: string;

  @IsString()
  REFRESH_TOKEN_EXPIRY: string;

  // Cookie / Session
  @IsString()
  REFRESH_COOKIE_NAME: string;

  // Primary Database
  @IsString()
  PRIMARY_DB_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PRIMARY_DB_PORT: number;

  @IsString()
  PRIMARY_DB_USERNAME: string;

  @IsString()
  PRIMARY_DB_PASSWORD: string;

  @IsString()
  PRIMARY_DB_DATABASE: string;

  @IsEnum(['require', 'prefer', 'disable', 'no-verify'])
  PRIMARY_DB_SSL_MODE: 'require' | 'prefer' | 'disable' | 'no-verify';

  @IsString()
  PRIMARY_DB_DATABASE_DIRECT_URL: string;

  // OTP / Verification
  @IsString()
  OTP_EXPIRY: string;

  @IsNumber()
  @Min(1)
  OTP_MAX_ATTEMPTS: number;

  // Deployment license public key (Ed25519, base64 spki DER) — verifies signed internal API requests and licenses
  @IsString()
  LICENSE_PUBLIC_KEY: string;

  // Deployment agent public key (Ed25519, base64 spki DER) — verifies signed agent→core requests (gitea credential writes)
  @IsString()
  AGENT_PUBLIC_KEY: string;

  @IsString()
  @IsOptional()
  DEPLOYMENT_ID?: string;

  // Redis
  @IsString()
  REDIS_URL: string;

  // Cache
  @IsOptional()
  @IsIn(['lru', 'redis'])
  CACHE_DRIVER?: 'lru' | 'redis';

  // Meta app for tenant WhatsApp — distinct from cloud-server's onboarding app
  // Verifies X-Hub-Signature-256 on delivery callbacks
  @IsString()
  META_CLIENT_SECRET: string;

  // Answers Meta's hub.challenge handshake when the callback URL is registered
  @IsString()
  WHATSAPP_VERIFY_TOKEN: string;

  // Domains
  @IsString()
  BASE_DOMAIN: string;

  // Media service
  @IsNumber()
  @Min(1)
  MEDIA_MAX_FILE_SIZE_MB: number;

  // Constrained, not a free string: the storage key blocks are validated by matching on this value, so a typo would
  // match no branch and silently skip every storage key instead of failing at startup
  @IsIn(['r2'])
  MEDIA_STORAGE_PROVIDER: string;

  @IsNumber()
  @Min(60)
  MEDIA_SIGNED_URL_EXPIRY: number;

  // Email / Brevo
  @IsString()
  @IsOptional()
  BREVO_API_KEY?: string;

  @IsEmail()
  @IsOptional()
  SENDER_EMAIL?: string;

  @IsString()
  @IsOptional()
  SENDER_NAME?: string;
}

// Validates environment variables at application startup
export function validate(config: Record<string, unknown>): Record<string, unknown> {
  const processedConfig = {
    ...config,
    PORT: config.PORT ? parseInt(config.PORT as string, 10) : undefined,
    PRIMARY_DB_PORT: config.PRIMARY_DB_PORT ? parseInt(config.PRIMARY_DB_PORT as string, 10) : undefined,
    OTP_MAX_ATTEMPTS: config.OTP_MAX_ATTEMPTS ? parseInt(config.OTP_MAX_ATTEMPTS as string, 10) : undefined,
    BCRYPT_SALT_ROUNDS: config.BCRYPT_SALT_ROUNDS ? parseInt(config.BCRYPT_SALT_ROUNDS as string, 10) : undefined,
    MEDIA_MAX_FILE_SIZE_MB: config.MEDIA_MAX_FILE_SIZE_MB
      ? parseInt(config.MEDIA_MAX_FILE_SIZE_MB as string, 10)
      : undefined,
    MEDIA_SIGNED_URL_EXPIRY: config.MEDIA_SIGNED_URL_EXPIRY
      ? parseInt(config.MEDIA_SIGNED_URL_EXPIRY as string, 10)
      : undefined,
    MASK_PII: config.MASK_PII ?? 'false',
  };

  const validatedConfig = plainToInstance(EnvironmentVariables, processedConfig, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints ? Object.values(error.constraints).join(', ') : 'Unknown error';
        return `  - ${error.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(
      `Environment validation failed:\n\n${errorMessages}\n\nPlease check your .env file and ensure all required variables are set correctly.`,
    );
  }

  return processedConfig;
}
