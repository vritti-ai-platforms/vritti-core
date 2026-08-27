import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { OrgId } from '@/security/decorators';
import { StructureResponseDto } from '../dto/response/structure-response.dto';
import { ApiGetStructure } from './docs/structure.docs';
import { StructureService } from './services/structure-api.service';

@ApiTags('Structure')
@Controller('structure/internal')
@Require(AuthType.Cloud)
export class StructureController {
  private readonly logger = new Logger(StructureController.name);

  constructor(private readonly structureApiService: StructureService) {}

  // Returns the organization structure aggregate
  @Get()
  @ApiGetStructure()
  async getStructure(@OrgId() orgId: string): Promise<StructureResponseDto> {
    this.logger.log(`GET /structure/internal — org ${orgId}`);
    return this.structureApiService.getStructure(orgId);
  }
}
