import { Module } from '@nestjs/common';
import { CommerceClientModule } from './commerce-client.module';

@Module({
  imports: [CommerceClientModule],
})
export class CommerceGatewayModule {}
