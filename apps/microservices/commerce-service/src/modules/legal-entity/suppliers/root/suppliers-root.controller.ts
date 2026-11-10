import type { SupplierDetailDto, SupplierDto } from '@domain/suppliers/dto/entity/supplier.dto';
import { BulkSetSupplierActiveDto } from '@domain/suppliers/dto/request/bulk-set-supplier-active.dto';
import { BulkSetSupplierDefaultPaymentTermDto } from '@domain/suppliers/dto/request/bulk-set-supplier-default-payment-term.dto';
import { ChangeSupplierCurrencyDto } from '@domain/suppliers/dto/request/change-supplier-currency.dto';
import { CreateSupplierDto } from '@domain/suppliers/dto/request/create-supplier.dto';
import { SetSupplierActiveDto } from '@domain/suppliers/dto/request/set-supplier-active.dto';
import { SetSupplierDefaultPaymentTermDto } from '@domain/suppliers/dto/request/set-supplier-default-payment-term.dto';
import { SetSupplierPaymentBlockedDto } from '@domain/suppliers/dto/request/set-supplier-payment-blocked.dto';
import { SetSupplierPurchasingBlockedDto } from '@domain/suppliers/dto/request/set-supplier-purchasing-blocked.dto';
import { UpdateSupplierDto } from '@domain/suppliers/dto/request/update-supplier.dto';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { SuppliersService } from './services/suppliers-root.service';

@Controller()
export class SuppliersRootController {
  private readonly logger = new Logger(SuppliersRootController.name);

  constructor(
    private readonly service: SuppliersDomainService,
    private readonly suppliersService: SuppliersService,
  ) {}

  @MessagePattern({ cmd: 'le.suppliers.table' })
  async table(@Payload() state: TableState): Promise<{ result: SupplierDto[]; count: number }> {
    this.logger.log('suppliers.table');
    return this.service.findForTable(state);
  }

  @MessagePattern({ cmd: 'le.suppliers.create' })
  async create(@Payload() dto: CreateSupplierDto): Promise<CreateResponseDto<SupplierDto>> {
    this.logger.log(`suppliers.create — partyId: ${dto.partyId}`);
    return this.suppliersService.create(dto);
  }

  @MessagePattern({ cmd: 'le.suppliers.findById' })
  async findById(@Payload() data: { id: string }): Promise<SupplierDetailDto> {
    this.logger.log('suppliers.findById');
    return this.service.findById(data.id);
  }

  @MessagePattern({ cmd: 'le.suppliers.update' })
  async update(@Payload() dto: UpdateSupplierDto): Promise<SuccessResponseDto> {
    const { id, ...updateData } = dto;
    this.logger.log('suppliers.update');
    return this.service.update(id, updateData);
  }

  @MessagePattern({ cmd: 'le.suppliers.setActive' })
  async setActive(@Payload() dto: SetSupplierActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.setActive — id: ${dto.id}, isActive: ${dto.isActive}`);
    return this.service.setActive(dto.id, dto.isActive);
  }

  @MessagePattern({ cmd: 'le.suppliers.bulkSetActive' })
  async bulkSetActive(@Payload() dto: BulkSetSupplierActiveDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.bulkSetActive — ${dto.ids.length} selected, isActive: ${dto.isActive}`);
    return this.service.bulkSetActive(dto.ids, dto.isActive);
  }

  @MessagePattern({ cmd: 'le.suppliers.setDefaultPaymentTerm' })
  async setDefaultPaymentTerm(@Payload() dto: SetSupplierDefaultPaymentTermDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.setDefaultPaymentTerm — id: ${dto.id}, paymentTermId: ${dto.defaultPaymentTermId}`);
    return this.service.setDefaultPaymentTerm(dto.id, dto.defaultPaymentTermId);
  }

  @MessagePattern({ cmd: 'le.suppliers.bulkSetDefaultPaymentTerm' })
  async bulkSetDefaultPaymentTerm(@Payload() dto: BulkSetSupplierDefaultPaymentTermDto): Promise<SuccessResponseDto> {
    this.logger.log(
      `suppliers.bulkSetDefaultPaymentTerm — ${dto.ids.length} selected, paymentTermId: ${dto.defaultPaymentTermId}`,
    );
    return this.service.bulkSetDefaultPaymentTerm(dto.ids, dto.defaultPaymentTermId);
  }

  @MessagePattern({ cmd: 'le.suppliers.setPurchasingBlocked' })
  async setPurchasingBlocked(@Payload() dto: SetSupplierPurchasingBlockedDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.setPurchasingBlocked — id: ${dto.id}, purchasingBlocked: ${dto.purchasingBlocked}`);
    return this.service.setPurchasingBlocked(dto.id, dto.purchasingBlocked);
  }

  @MessagePattern({ cmd: 'le.suppliers.setPaymentBlocked' })
  async setPaymentBlocked(@Payload() dto: SetSupplierPaymentBlockedDto): Promise<SuccessResponseDto> {
    this.logger.log(`suppliers.setPaymentBlocked — id: ${dto.id}, paymentBlocked: ${dto.paymentBlocked}`);
    return this.service.setPaymentBlocked(dto.id, dto.paymentBlocked);
  }

  @MessagePattern({ cmd: 'le.suppliers.delete' })
  async delete(@Payload() data: { id: string }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.delete');
    return this.service.delete(data.id);
  }

  @MessagePattern({ cmd: 'le.suppliers.changeCurrency' })
  async changeCurrency(@Payload() data: ChangeSupplierCurrencyDto): Promise<SuccessResponseDto> {
    const { id, ...dto } = data;
    this.logger.log(`suppliers.changeCurrency — id: ${id}, currency: ${dto.currencyCode}`);
    return this.suppliersService.changeCurrency(id, dto);
  }
}
