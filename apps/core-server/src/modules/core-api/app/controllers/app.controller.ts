import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require, SkipCsrf } from '@vritti/api-sdk/auth';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { AppDomainService } from '@/modules/domain/app/services/app.service';
import { OrgId } from '@/security/decorators/org-id.decorator';
import { CreateAppInternalDto } from '../dto/request/create-app-internal.dto';
import { UpdateAppInternalDto } from '../dto/request/update-app-internal.dto';
import { AppResponseDto } from '../dto/response/app-response.dto';
import { AppSigningKeyResponseDto } from '../dto/response/app-signing-key-response.dto';

/**
 * App credentials, managed from cloud-web.
 *
 * Every route is `@Require(AuthType.Cloud)` — the signature is what authenticates the caller,
 * verified by `CloudRequestResolver` from the auth hook, the same shape as `/users/internal`.
 *
 * The organization comes from `@OrgId()`, which reads the context the guard
 * established from the signed `x-org-id` header. Every lookup is scoped by it:
 * an id alone would let one organization address another's credential.
 */
@ApiTags('Apps')
@Controller('apps')
@SkipCsrf()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppDomainService) {}

  @Post('internal')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.CREATED)
  async createFromCloud(@OrgId() orgId: string, @Body() dto: CreateAppInternalDto): Promise<AppResponseDto> {
    this.logger.log(`POST /apps/internal — ${dto.type} for org ${orgId}`);
    const app = await this.appService.create({
      organizationId: orgId,
      name: dto.name,
      type: dto.type,
      permissions: dto.permissions,
    });
    return new AppResponseDto(app);
  }

  @Get('internal')
  @Require(AuthType.Cloud)
  async listFromCloud(@OrgId() orgId: string): Promise<AppResponseDto[]> {
    this.logger.log(`GET /apps/internal — org ${orgId}`);
    const apps = await this.appService.listForOrg(orgId);
    return apps.map((app) => new AppResponseDto(app));
  }

  /**
   * The private key, on demand.
   *
   * A separate route rather than a field on the list so revealing a credential
   * is always a deliberate act — and so it shows up in the access log as one.
   */
  @Get('internal/:id/signing-key')
  @Require(AuthType.Cloud)
  async revealSigningKey(@Param('id') id: string, @OrgId() orgId: string): Promise<AppSigningKeyResponseDto> {
    this.logger.log(`GET /apps/internal/${id}/signing-key`);
    const app = await this.requireApp(id, orgId);
    return new AppSigningKeyResponseDto(app.clientId, app.signingKey);
  }

  @Patch('internal/:id')
  @Require(AuthType.Cloud)
  async updateFromCloud(
    @Param('id') id: string,
    @OrgId() orgId: string,
    @Body() dto: UpdateAppInternalDto,
  ): Promise<AppResponseDto> {
    this.logger.log(`PATCH /apps/internal/${id}`);
    await this.requireApp(id, orgId);

    if (dto.name !== undefined) await this.appService.rename(id, dto.name);
    if (dto.permissions !== undefined) await this.appService.setPermissions(id, dto.permissions);
    const app =
      dto.isActive !== undefined ? await this.appService.setActive(id, dto.isActive) : await this.requireApp(id, orgId);

    return new AppResponseDto(app);
  }

  /**
   * New keypair, same client id — the caller swaps one value, not two.
   *
   * Returns the new private key rather than the app row: whoever rotates needs the replacement
   * immediately, and making them call the reveal route straight afterwards would mean two audited
   * exposures for one intended act.
   */
  @Post('internal/:id/rotate')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.OK)
  async rotateFromCloud(@Param('id') id: string, @OrgId() orgId: string): Promise<AppSigningKeyResponseDto> {
    this.logger.log(`POST /apps/internal/${id}/rotate`);
    await this.requireApp(id, orgId);
    const app = await this.appService.rotate(id);
    return new AppSigningKeyResponseDto(app.clientId, app.signingKey);
  }

  /**
   * A POST rather than a DELETE because `CoreHttpService.delete` carries no query
   * string and no body, so a true DELETE could not name the org scope every route
   * here requires.
   */
  @Post('internal/:id/delete')
  @Require(AuthType.Cloud)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFromCloud(@Param('id') id: string, @OrgId() orgId: string): Promise<void> {
    this.logger.log(`POST /apps/internal/${id}/delete`);
    const app = await this.requireApp(id, orgId);
    await this.appService.delete(app);
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
