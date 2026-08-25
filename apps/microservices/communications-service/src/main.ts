import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RpcProblemExceptionFilter } from '@vritti/api-sdk/nats';
import { AppModule } from './app.module';

// Read straight from the environment, not ConfigService: the transport is configured before
// AppModule (and so env.validation) ever runs, so this is the earliest the value can be checked.
function requireNatsUrl(): string {
  const url = process.env.NATS_URL;
  if (!url) {
    throw new Error('NATS_URL environment variable is required');
  }
  return url;
}

const NATS_URL = requireNatsUrl();

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.NATS,
    options: {
      servers: [NATS_URL],
      queue: 'communications-service',
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new RpcProblemExceptionFilter());

  await app.listen();
  console.log(`Communications Service listening on NATS at ${NATS_URL}`);
}

bootstrap();
