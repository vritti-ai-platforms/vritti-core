import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RpcProblemExceptionFilter } from '@vritti/api-sdk/nats';
import { AppModule } from './app.module';

// NATS connection configuration
const NATS_URL = process.env.NATS_URL ?? 'nats://localhost:4222';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.NATS,
    options: {
      servers: [NATS_URL],
      queue: 'commerce-service',
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
  console.log(`Commerce Service listening on NATS at ${NATS_URL}`);
}

bootstrap();
