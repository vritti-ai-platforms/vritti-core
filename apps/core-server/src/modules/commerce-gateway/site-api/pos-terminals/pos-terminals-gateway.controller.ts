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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import {
  type CreateResponseDto,
  SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
} from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import {
  ApiCreate,
  ApiDelete,
  ApiFindById,
  ApiSelectLocations,
  ApiTable,
  ApiUpdate,
} from './docs/pos-terminals-gateway.docs';
import { CreatePosTerminalDto } from '@commerce/pos-terminals/dto/request/create-pos-terminal.dto';
import { UpdatePosTerminalDto } from '@commerce/pos-terminals/dto/request/update-pos-terminal.dto';
import type { PosTerminalResponseDto } from '@commerce/pos-terminals/dto/response/pos-terminal-response.dto';
import type { PosTerminalTableResponseDto } from '@commerce/pos-terminals/dto/response/pos-terminal-table-response.dto';
import { PosTerminalsGatewayService } from './services/pos-terminals-gateway.service';

@ApiTags('Commerce - POS Terminals')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('pos-terminals')
export class PosTerminalsGatewayController {
  private readonly logger = new Logger(PosTerminalsGatewayController.name);

  constructor(private readonly posTerminalsGatewayService: PosTerminalsGatewayService) {}

  // Returns paginated POS terminals for the data table with server-stored state
  @Get('table')
  @ApiTable()
  table(@UserId() userId: string): Promise<PosTerminalTableResponseDto> {
    this.logger.log('GET /commerce-api/pos-terminals/table');
    return this.posTerminalsGatewayService.findForTable(userId);
  }

  // Returns POS-role storage location options for select dropdowns
  @Get('locations/select')
  @ApiSelectLocations()
  @RequireSession(SessionTypeValues.WEB, SessionTypeValues.MOBILE)
  selectLocations(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/pos-terminals/locations/select');
    return this.posTerminalsGatewayService.selectPosLocations(query);
  }

  // Returns a single POS terminal by ID
  @Get(':id')
  @ApiFindById()
  findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<PosTerminalResponseDto> {
    this.logger.log(`GET /commerce-api/pos-terminals/${id}`);
    return this.posTerminalsGatewayService.findById(id);
  }

  // Creates a new POS terminal
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreate()
  create(@Body() dto: CreatePosTerminalDto): Promise<CreateResponseDto<PosTerminalResponseDto>> {
    this.logger.log('POST /commerce-api/pos-terminals');
    return this.posTerminalsGatewayService.create(dto);
  }

  // Updates an existing POS terminal
  @Patch(':id')
  @ApiUpdate()
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdatePosTerminalDto): Promise<SuccessResponseDto> {
    this.logger.log(`PATCH /commerce-api/pos-terminals/${id}`);
    return this.posTerminalsGatewayService.update(id, dto);
  }

  // Deletes a POS terminal
  @Delete(':id')
  @ApiDelete()
  delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/pos-terminals/${id}`);
    return this.posTerminalsGatewayService.delete(id);
  }
}
