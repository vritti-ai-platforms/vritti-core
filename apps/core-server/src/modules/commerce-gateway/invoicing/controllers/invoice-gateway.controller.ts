import { Body, Controller, Get, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { UserId } from '@vritti/api-sdk';
import { UserService } from '@domain/user/services/user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { type Observable, firstValueFrom } from 'rxjs';
import { UpdateInvoiceStatusDto } from '../dto/request/update-invoice-status.dto';
import { InvoiceGatewayService } from '../services/invoice-gateway.service';

@ApiTags('Commerce — Invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceGatewayController {
  private readonly logger = new Logger(InvoiceGatewayController.name);

  constructor(private readonly invoiceGatewayService: InvoiceGatewayService,
    private readonly userService: UserService,
  ) {}

  // Generates an invoice from an order
  @Post('generate/:orderId')
  generate(@Param('orderId') orderId: string): Observable<unknown> {
    this.logger.log(`POST /commerce-api/invoices/generate/${orderId}`);
    return this.invoiceGatewayService.generate(orderId);
  }

  // Lists all invoices for an org+bu
  @Get()
  async findAll(
    @UserId() userId: string,
    @Query('businessUnitId') businessUnitId: string,
  ): Promise<unknown> {
    this.logger.log('GET /commerce-api/invoices');
    const user = await this.userService.findByIdOrThrow(userId);
    return firstValueFrom(this.invoiceGatewayService.findAll(user.organizationId, businessUnitId));
  }

  // Returns a single invoice by ID
  @Get(':id')
  findById(@Param('id') id: string): Observable<unknown> {
    this.logger.log(`GET /commerce-api/invoices/${id}`);
    return this.invoiceGatewayService.findById(id);
  }

  // Updates the invoice status
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInvoiceStatusDto): Observable<unknown> {
    this.logger.log(`PATCH /commerce-api/invoices/${id}/status`);
    return this.invoiceGatewayService.updateStatus(id, dto.status);
  }
}
