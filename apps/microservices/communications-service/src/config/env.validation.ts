import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

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

  @IsString()
  APP_NAME: string;

  // NATS
  @IsString()
  NATS_URL: string;

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

  // Meta Graph API
  @IsString()
  @IsOptional()
  WHATSAPP_API_VERSION: string;

  // Meta app secret — "Require app secret" is on, so every Graph call must carry appsecret_proof
  @IsString()
  META_CLIENT_SECRET: string;
}

// Validates environment variables at application startup
export function validate(config: Record<string, unknown>): Record<string, unknown> {
  const processedConfig = {
    ...config,
    PRIMARY_DB_PORT: config.PRIMARY_DB_PORT ? parseInt(config.PRIMARY_DB_PORT as string, 10) : undefined,
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
