import { CreateStorageTypeDto } from '@commerce/storage-types/dto/request/create-storage-type.dto';
import { UpdateStorageTypeDto } from '@commerce/storage-types/dto/request/update-storage-type.dto';
import type { StorageTypeResponseDto } from '@commerce/storage-types/dto/response/storage-type-response.dto';
import type { StorageTypeTableResponseDto } from '@commerce/storage-types/dto/response/storage-type-table-response.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { ORG_STORAGE_TYPES } from '@vritti/commerce-permissions/storage-types';
import { SessionTypeValues } from '@/db/schema';
import { RequireFeature, RequirePermission } from '@/rbac/decorators';
import {
  ApiCreateStorageType,
  ApiDeleteStorageType,
  ApiFindForTableStorageTypes,
  ApiFindStorageTypeById,
  ApiUpdateStorageType,
} from './docs/storage-types-gateway.docs';
import { StorageTypesGatewayService } from './services/storage-types-gateway.service';

@ApiTags('Commerce - Storage Types')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
@RequireFeature(ORG_STORAGE_TYPES.featureCode)
@Controller('org/storage-types')
export class StorageTypesGatewayController {
  private readonly logger = new Logger(StorageTypesGatewayController.name);

  constructor(private readonly service: StorageTypesGatewayService) {}

  // Returns paginated storage types for the data table
  @Get('table')
  @RequirePermission(ORG_STORAGE_TYPES.view)
  @ApiFindForTableStorageTypes()
  getTable(@UserId() userId: string): Promise<StorageTypeTableResponseDto> {
    this.logger.log('GET /commerce-api/org/storage-types/table');
    return this.service.findForTable(userId);
  }

  // Returns a storage type by ID
  @Get(':id')
  @RequirePermission(ORG_STORAGE_TYPES.view)
  @ApiFindStorageTypeById()
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<StorageTypeResponseDto> {
    this.logger.log(`GET /commerce-api/org/storage-types/${id}`);
    return this.service.findById(id);
  }

  // Creates a new storage type
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(ORG_STORAGE_TYPES.add)
  @ApiCreateStorageType()
  create(@Body() dto: CreateStorageTypeDto): Promise<CreateResponseDto<StorageTypeResponseDto>> {
    this.logger.log('POST /commerce-api/org/storage-types');
    return this.service.create(dto);
  }

  // Updates a storage type by ID
  @Patch(':id')
  @RequirePermission(ORG_STORAGE_TYPES.edit)
  @ApiUpdateStorageType()
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateStorageTypeDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/org/storage-types/${id}`);
    return this.service.update(id, dto);
  }

  // Deletes a storage type by ID
  @Delete(':id')
  @RequirePermission(ORG_STORAGE_TYPES.delete)
  @ApiDeleteStorageType()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/org/storage-types/${id}`);
    return this.service.delete(id);
  }
}
