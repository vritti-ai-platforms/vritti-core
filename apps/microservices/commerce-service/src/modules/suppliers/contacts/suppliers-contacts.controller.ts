import type { SupplierContactDto } from '@domain/supplier-contacts/dto/entity/supplier-contact.dto';
import { SupplierContactsService } from '@domain/supplier-contacts/services/supplier-contacts.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import type { CreateSupplierContactDto } from './dto/request/create-supplier-contact.dto';
import type { UpdateSupplierContactDto } from './dto/request/update-supplier-contact.dto';

@Controller()
export class SuppliersContactsController {
  private readonly logger = new Logger(SuppliersContactsController.name);

  constructor(private readonly service: SupplierContactsService) {}

  @MessagePattern({ cmd: 'suppliers.contacts' })
  contacts(@Payload() data: { supplierId: string }): Promise<SupplierContactDto[]> {
    this.logger.log('suppliers.contacts');
    return this.service.listBySupplierId(data.supplierId);
  }

  @MessagePattern({ cmd: 'suppliers.addContact' })
  addContact(
    @Payload() data: { supplierId: string } & CreateSupplierContactDto,
  ): Promise<CreateResponseDto<SupplierContactDto>> {
    const { supplierId, ...payload } = data;
    this.logger.log(`suppliers.addContact — name: ${payload.name}`);
    return this.service.createContact(supplierId, payload);
  }

  @MessagePattern({ cmd: 'suppliers.updateContact' })
  updateContact(
    @Payload() data: { supplierId: string; contactId: string } & UpdateSupplierContactDto,
  ): Promise<SuccessResponseDto> {
    const { supplierId, contactId, ...payload } = data;
    this.logger.log('suppliers.updateContact');
    return this.service.updateContact(supplierId, contactId, payload);
  }

  @MessagePattern({ cmd: 'suppliers.deleteContact' })
  deleteContact(@Payload() data: { supplierId: string; contactId: string }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.deleteContact');
    return this.service.deleteContact(data.supplierId, data.contactId);
  }

  @MessagePattern({ cmd: 'suppliers.markPrimaryContact' })
  markPrimary(@Payload() data: { supplierId: string; contactId: string }): Promise<SuccessResponseDto> {
    this.logger.log('suppliers.markPrimaryContact');
    return this.service.markPrimary(data.supplierId, data.contactId);
  }
}
