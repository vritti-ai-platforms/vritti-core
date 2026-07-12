import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, UserId } from '@vritti/api-sdk/auth';
import { SessionTypeValues } from '@/db/schema';
import { CreateInvoiceDto } from './dto/request/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/request/update-invoice.dto';
import type { InvoiceDetailResponseDto, InvoiceResponseDto } from './dto/response/invoice-response.dto';
import type { InvoiceTableResponseDto } from './dto/response/invoice-table-response.dto';
import { InvoicesGatewayService } from './services/invoices-gateway.service';

@ApiTags('Commerce - Invoices')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.WEB)
@Controller('invoices')
export class InvoicesGatewayController {
  constructor(private readonly invoicesGatewayService: InvoicesGatewayService) {}

  // Returns paginated invoices for the data table with server-stored state
  @Get('table')
  getInvoiceTable(@UserId() userId: string): Promise<InvoiceTableResponseDto> {
    return this.invoicesGatewayService.findForTable(userId);
  }

  // Creates a new invoice
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateInvoiceDto): Promise<InvoiceResponseDto> {
    return this.invoicesGatewayService.create(dto);
  }

  // Returns a single invoice by ID with line items
  @Get(':id')
  findById(@Param('id') id: string): Promise<InvoiceDetailResponseDto> {
    return this.invoicesGatewayService.findById(id);
  }

  // Updates an invoice by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto): Promise<InvoiceResponseDto> {
    return this.invoicesGatewayService.update(id, dto);
  }
}
