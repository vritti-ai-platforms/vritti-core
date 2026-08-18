import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipCsrf } from '@vritti/api-sdk/auth';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { AppDomainService } from '@/modules/domain/app/services/app.service';
import { CloudSignatureGuard } from '@/security/guards/cloud-signature.guard';
import { AppScopeInternalDto } from '../dto/request/app-scope-internal.dto';
import { CreateAppInternalDto } from '../dto/request/create-app-internal.dto';
import { UpdateAppInternalDto } from '../dto/request/update-app-internal.dto';
import { AppResponseDto } from '../dto/response/app-response.dto';
import { AppSigningKeyResponseDto } from '../dto/response/app-signing-key-response.dto';

/**
 * App credentials, managed from cloud-web.
 *
 * Every route is `@Public()` + `CloudSignatureGuard` — the same shape as
 * `/users/internal`. `@Public()` turns the *session* guard off because cloud
 * carries no user session; the signature is what authenticates the caller.
 *
 * Every route also takes `orgId` and scopes its lookup by it. An id alone would
 * let one organization address another's credential, and cloud is trusted to
 * name the org but not to have picked the right one.
 */
@ApiTags('Apps')
@Controller('apps')
@SkipCsrf()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppDomainService) {}

  @Post('internal')
  @Public()
  @UseGuards(CloudSignatureGuard)
  @HttpCode(HttpStatus.CREATED)
  async createFromCloud(@Body() dto: CreateAppInternalDto): Promise<AppResponseDto> {
    this.logger.log(`POST /apps/internal — ${dto.type} for org ${dto.orgId}`);
    const app = await this.appService.create({
      organizationId: dto.orgId,
      name: dto.name,
      type: dto.type,
    });
    return new AppResponseDto(app);
  }

  @Get('internal')
  @Public()
  @UseGuards(CloudSignatureGuard)
  async listFromCloud(@Query() dto: AppScopeInternalDto): Promise<AppResponseDto[]> {
    this.logger.log(`GET /apps/internal?orgId=${dto.orgId}`);
    const apps = await this.appService.listForOrg(dto.orgId);
    return apps.map((app) => new AppResponseDto(app));
  }

  /**
   * The private key, on demand.
   *
   * A separate route rather than a field on the list so revealing a credential
   * is always a deliberate act — and so it shows up in the access log as one.
   */
  @Get('internal/:id/signing-key')
  @Public()
  @UseGuards(CloudSignatureGuard)
  async revealSigningKey(
    @Param('id') id: string,
    @Query() dto: AppScopeInternalDto,
  ): Promise<AppSigningKeyResponseDto> {
    this.logger.log(`GET /apps/internal/${id}/signing-key`);
    const app = await this.requireApp(id, dto.orgId);
    return new AppSigningKeyResponseDto(app.clientId, app.signingKey);
  }

  @Patch('internal/:id')
  @Public()
  @UseGuards(CloudSignatureGuard)
  async updateFromCloud(@Param('id') id: string, @Body() dto: UpdateAppInternalDto): Promise<AppResponseDto> {
    this.logger.log(`PATCH /apps/internal/${id}`);
    await this.requireApp(id, dto.orgId);

    if (dto.name !== undefined) await this.appService.rename(id, dto.name);
    const app =
      dto.isActive !== undefined
        ? await this.appService.setActive(id, dto.isActive)
        : await this.requireApp(id, dto.orgId);

    return new AppResponseDto(app);
  }

  /** New keypair, same client id — the caller swaps one value, not two. */
  @Post('internal/:id/rotate')
  @Public()
  @UseGuards(CloudSignatureGuard)
  @HttpCode(HttpStatus.OK)
  async rotateFromCloud(@Param('id') id: string, @Body() dto: AppScopeInternalDto): Promise<AppResponseDto> {
    this.logger.log(`POST /apps/internal/${id}/rotate`);
    await this.requireApp(id, dto.orgId);
    return new AppResponseDto(await this.appService.rotate(id));
  }

  /**
   * A POST rather than a DELETE, for two reasons: the row survives as a record
   * that the credential existed and when it stopped working, so nothing is
   * actually deleted — and `CoreHttpService.delete` sends no query string, so a
   * DELETE could not carry the org scope every route here requires.
   */
  @Post('internal/:id/revoke')
  @Public()
  @UseGuards(CloudSignatureGuard)
  @HttpCode(HttpStatus.OK)
  async revokeFromCloud(@Param('id') id: string, @Body() dto: AppScopeInternalDto): Promise<AppResponseDto> {
    this.logger.log(`POST /apps/internal/${id}/revoke`);
    await this.requireApp(id, dto.orgId);
    return new AppResponseDto(await this.appService.revoke(id));
  }

  private async requireApp(id: string, orgId: string) {
    const app = await this.appService.findInOrg(id, orgId);
    if (!app) {
      throw new NotFoundException({
        label: 'App Not Found',
        detail: 'That app does not exist for this organization.',
      });
    }
    return app;
  }
}
