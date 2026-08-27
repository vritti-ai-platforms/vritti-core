import { CreateCustomerDto } from '@commerce/customers/dto/request/create-customer.dto';
import { UpdateCustomerDto } from '@commerce/customers/dto/request/update-customer.dto';
import type { CustomerResponseDto } from '@commerce/customers/dto/response/customer-response.dto';
import type { CustomerTableResponseDto } from '@commerce/customers/dto/response/customer-table-response.dto';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthType, Require, UserId } from '@vritti/api-sdk/auth';
import type { SuccessResponseDto } from '@vritti/api-sdk/database';
import { SessionTypeValues } from '@/db/schema';
import { CustomersGatewayService } from './services/customers-gateway.service';

@ApiTags('Commerce - Customers')
@ApiBearerAuth()
@Require(AuthType.Session, SessionTypeValues.WEB)
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
