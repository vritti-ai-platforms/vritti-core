import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequireSession, SelectOptionsQueryDto, type SelectQueryResult, type SuccessResponseDto, UserId } from '@vritti/api-sdk';
import { SessionTypeValues } from '@/db/schema';
import { CreateCustomerDto } from './dto/request/create-customer.dto';
import { UpdateCustomerDto } from './dto/request/update-customer.dto';
import type { CustomerResponseDto } from './dto/response/customer-response.dto';
import type { CustomerTableResponseDto } from './dto/response/customer-table-response.dto';
import { CustomersGatewayService } from './services/customers-gateway.service';

@ApiTags('Commerce - Customers')
@ApiBearerAuth()
@RequireSession(SessionTypeValues.NEXUS)
@Controller('customers')
export class CustomersGatewayController {
  private readonly logger = new Logger(CustomersGatewayController.name);

  constructor(private readonly customersGatewayService: CustomersGatewayService) {}

  // Returns paginated customers for the data table with server-stored state
  @Get('table')
  getCustomerTable(@UserId() userId: string): Promise<CustomerTableResponseDto> {
    this.logger.log('GET /commerce-api/customers/table');
    return this.customersGatewayService.findForTable(userId);
  }

  // Returns paginated customer options for select dropdowns
  @Get('select')
  @RequireSession(SessionTypeValues.NEXUS, SessionTypeValues.MOBILE)
  select(@Query() query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    this.logger.log('GET /commerce-api/customers/select');
    return this.customersGatewayService.select(query);
  }

  // Creates a new customer
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    this.logger.log('POST /commerce-api/customers');
    return this.customersGatewayService.create(dto);
  }

  // Returns a single customer by ID
  @Get(':id')
  findById(@Param('id') id: string): Promise<CustomerResponseDto> {
    this.logger.log(`GET /commerce-api/customers/${id}`);
    return this.customersGatewayService.findById(id);
  }

  // Updates a customer by ID
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    this.logger.log(`PATCH /commerce-api/customers/${id}`);
    return this.customersGatewayService.update(id, dto);
  }

  // Deletes a customer by ID
  @Delete(':id')
  delete(@Param('id') id: string): Promise<SuccessResponseDto> {
    this.logger.log(`DELETE /commerce-api/customers/${id}`);
    return this.customersGatewayService.delete(id);
  }
}
