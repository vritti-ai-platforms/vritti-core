import { Module } from '@nestjs/common';
import { SelectApiController } from './select-api.controller';

@Module({
  controllers: [SelectApiController],
})
export class SelectApiModule {}
