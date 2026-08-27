import { ReceiveCatalogInternalDto } from '@domain/catalog/dto/request/receive-catalog-internal.dto';
import { CatalogDomainService } from '@domain/catalog/services/catalog.service';
import { Body, Controller, HttpCode, HttpStatus, Logger, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { ApiReceiveCatalog } from '../docs/catalog.docs';

@ApiTags('Catalog')
@Controller('catalog/internal')
@Require(AuthType.Cloud)
// The catalog license is deployment-wide — one active row per database, not per organization
export class CatalogController {
  private readonly logger = new Logger(CatalogController.name);

  constructor(private readonly catalogService: CatalogDomainService) {}

  // Receives the signed catalog license from cloud-server (one per deployment, idempotent by hash)
  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiReceiveCatalog()
  async receive(@Body() dto: ReceiveCatalogInternalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PUT /catalog/internal — version ${dto.payload?.version}`);
    return this.catalogService.receive(dto);
  }
}
