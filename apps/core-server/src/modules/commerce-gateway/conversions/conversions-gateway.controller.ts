import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateConversionDto } from './dto/request/create-conversion.dto';
import type { ConversionDetailResponseDto } from './dto/response/conversion-response.dto';
import type { ConversionTableResponseDto } from './dto/response/conversion-table-response.dto';
import { ConversionsGatewayService } from './services/conversions-gateway.service';

@ApiTags('Commerce - Conversions')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('conversions')
export class ConversionsGatewayController {
  private readonly logger = new Logger(ConversionsGatewayController.name);

  constructor(private readonly service: ConversionsGatewayService) {}

  // Returns paginated conversions for the data table with server-stored state
  @Get('table')
  getConversionTable(@UserId() userId: string): Promise<ConversionTableResponseDto> {
    return this.service.findForTable(userId);
  }

  // Creates a new conversion
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateConversionDto): Promise<ConversionDetailResponseDto> {
    return this.service.create(dto);
  }

  // Returns a single conversion by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<ConversionDetailResponseDto> {
    return this.service.findById(id);
  }

  // Completes a conversion and adjusts inventory
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  complete(@Param('id') id: string): Promise<{ success: boolean; message: string }> {
    return this.service.complete(id);
  }
}
