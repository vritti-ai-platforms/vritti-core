import { CreateTaxJurisdictionDto } from '@commerce/tax-jurisdictions/dto/request/create-tax-jurisdiction.dto';
import { UpdateTaxJurisdictionDto } from '@commerce/tax-jurisdictions/dto/request/update-tax-jurisdiction.dto';
import type { TaxJurisdictionResponseDto } from '@commerce/tax-jurisdictions/dto/response/tax-jurisdiction-response.dto';
import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import type { CreateResponseDto, SelectQueryResult, SuccessResponseDto } from '@vritti/api-sdk/database';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { TaxJurisdictionsGatewayService } from '@/modules/commerce-gateway/org-api/tax-jurisdictions/services/tax-jurisdictions-gateway.service';

// The cloud-facing surface. A legal entity's registration needs a jurisdiction, and the operator may
// have to create one during setup, so cloud gets select + create + update rather than the full tree.
@ApiTags('Internal - Tax Jurisdictions')
@Require(AuthType.Cloud)
@Controller('tax-jurisdictions/internal')
export class TaxJurisdictionInternalController {
  private readonly logger = new Logger(TaxJurisdictionInternalController.name);

  constructor(private readonly service: TaxJurisdictionsGatewayService) {}

  @Get('select')
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /tax-jurisdictions/internal/select');
    return this.service.findForSelect(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaxJurisdictionDto): Promise<CreateResponseDto<TaxJurisdictionResponseDto>> {
    this.logger.log(`POST /tax-jurisdictions/internal — ${dto.code}`);
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaxJurisdictionDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /tax-jurisdictions/internal/${id}`);
    return this.service.update(id, dto);
  }
}
