import { MediaDomainModule } from '@domain/media/media.module';
import { Module } from '@nestjs/common';
import { MediaController } from './controllers/media.controller';
import { MediaInternalController } from './controllers/media-internal.controller';

@Module({
  imports: [MediaDomainModule],
  controllers: [MediaController, MediaInternalController],
})
export class MediaApiModule {}
