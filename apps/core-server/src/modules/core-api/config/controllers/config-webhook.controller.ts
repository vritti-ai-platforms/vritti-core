import { Controller, HttpCode, HttpStatus, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf, SuccessResponseDto } from '@vritti/api-sdk';
import { WebhookSecretGuard } from '@/common/guards/webhook-secret.guard';
import { ConfigCacheService } from '@domain/config-cache/services/config-cache.service';

@ApiTags('Config')
@Controller('config/webhook')
@Public()
@SkipCsrf()
@UseGuards(WebhookSecretGuard)
export class ConfigWebhookController {
  private readonly logger = new Logger(ConfigWebhookController.name);

  constructor(private readonly configCacheService: ConfigCacheService) {}

  // Invalidates the cached config for a single organization
  @Post('invalidate/:orgId')
  @HttpCode(HttpStatus.OK)
  async invalidate(@Param('orgId') orgId: string): Promise<SuccessResponseDto> {
    this.logger.log(`POST /api/config/webhook/invalidate/${orgId}`);
    this.configCacheService.invalidate(orgId);
    return { success: true, message: 'Config cache invalidated.' };
  }

  // Invalidates the entire config cache (all organizations)
  @Post('invalidate-all')
  @HttpCode(HttpStatus.OK)
  async invalidateAll(): Promise<SuccessResponseDto> {
    this.logger.log('POST /api/config/webhook/invalidate-all');
    this.configCacheService.invalidateAll();
    return { success: true, message: 'All config cache invalidated.' };
  }
}
