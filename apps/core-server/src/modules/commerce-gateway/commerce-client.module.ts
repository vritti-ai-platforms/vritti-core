import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

export const COMMERCE_SERVICE = 'COMMERCE_SERVICE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: COMMERCE_SERVICE,
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [config.get<string>('NATS_URL', 'nats://localhost:4222')],
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class CommerceClientModule {}
