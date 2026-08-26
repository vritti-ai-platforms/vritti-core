import { Module } from '@nestjs/common';
import { MetaGraphHttpService } from './services/meta-graph-http.service';

@Module({
  providers: [MetaGraphHttpService],
  exports: [MetaGraphHttpService],
})
export class MetaGraphModule {}
