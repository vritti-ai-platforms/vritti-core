import { MediaGcService, type SweepResult } from '@domain/media/services/media-gc.service';
import { Controller, Logger, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';

// Operator-triggered, not session-authenticated: sweeping deletes objects across every tenant, which is not something
// an org's own users should be able to start.
@ApiExcludeController()
@Controller('media/internal')
@Public()
@SkipCsrf()
@UseGuards(CloudSignatureGuard)
export class MediaInternalController {
  private readonly logger = new Logger(MediaInternalController.name);

  constructor(private readonly mediaGcService: MediaGcService) {}

  // Deletes objects no media record refers to. Left manual rather than scheduled until its output has been watched
  // on real buckets — a cleanup job that deletes tenant files should earn automation, not start with it.
  @Post('sweep')
  async sweep(): Promise<SweepResult> {
    this.logger.log('POST /media/internal/sweep');
    return this.mediaGcService.sweepAll();
  }
}
