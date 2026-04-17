import { Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException, type SuccessResponseDto } from '@vritti/api-sdk';
import { SupplierContactDto } from '../dto/entity/supplier-contact.dto';
import { SupplierContactsRepository } from '../repositories/supplier-contacts.repository';

interface UpsertSupplierContactInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  designation?: string | null;
  notes?: string | null;
  isPrimary?: boolean;
  isActive?: boolean;
}

@Injectable()
export class SupplierContactsService {
  constructor(private readonly repository: SupplierContactsRepository) {}

  async listBySupplierId(supplierId: string): Promise<SupplierContactDto[]> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    const rows = await this.repository.listBySupplierId(supplierId);
    return rows.map(SupplierContactDto.from);
  }

  async createContact(supplierId: string, data: UpsertSupplierContactInput): Promise<SupplierContactDto> {
    const supplier = await this.repository.findSupplierById(supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');

    const totalContacts = await this.repository.countBySupplierId(supplierId);
    const hasPrimary = (await this.repository.findPrimaryBySupplierId(supplierId)) != null;

    if (totalContacts === 0 && data.isPrimary !== true) {
      throw new BadRequestException('First contact for a supplier must be primary.');
    }
    if (totalContacts > 0 && !hasPrimary) {
      throw new BadRequestException('Supplier must have exactly one primary contact.');
    }

    const makePrimary = data.isPrimary === true || totalContacts === 0;
    const created = await this.repository.transaction(async (tx) => {
      if (makePrimary) {
        await this.repository.clearPrimaryBySupplierId(supplierId, tx);
      }
      const row = await this.repository.createContact(
        {
          supplierId,
          name: data.name,
          phone: data.phone ?? null,
          email: data.email ?? null,
          designation: data.designation ?? null,
          notes: data.notes ?? null,
          isPrimary: makePrimary,
          isActive: data.isActive ?? true,
        },
        tx,
      );
      if (makePrimary) {
        await this.repository.syncSupplierPrimaryContact(
          supplierId,
          { name: row.name, phone: row.phone ?? null, email: row.email ?? null },
          tx,
        );
      }
      return row;
    });

    return SupplierContactDto.from(created);
  }

  async updateContact(
    supplierId: string,
    contactId: string,
    data: Partial<UpsertSupplierContactInput>,
  ): Promise<SupplierContactDto> {
    const existing = await this.repository.findBySupplierAndContactId(supplierId, contactId);
    if (!existing) throw new NotFoundException('Supplier contact not found.');

    if (data.isPrimary === false && existing.isPrimary) {
      throw new BadRequestException('Primary contact cannot be unset directly. Mark another contact as primary first.');
    }

    const updated = await this.repository.transaction(async (tx) => {
      if (data.isPrimary === true) {
        await this.repository.clearPrimaryBySupplierId(supplierId, tx);
      }
      const row = await this.repository.updateContact(
        contactId,
        {
          ...(data.name !== undefined ? { name: data.name } : {}),
          ...(data.phone !== undefined ? { phone: data.phone } : {}),
          ...(data.email !== undefined ? { email: data.email } : {}),
          ...(data.designation !== undefined ? { designation: data.designation } : {}),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
          ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
          ...(data.isPrimary === true ? { isPrimary: true } : {}),
        },
        tx,
      );

      if (row.isPrimary) {
        await this.repository.syncSupplierPrimaryContact(
          supplierId,
          { name: row.name, phone: row.phone ?? null, email: row.email ?? null },
          tx,
        );
      }
      return row;
    });

    return SupplierContactDto.from(updated);
  }

  async markPrimary(supplierId: string, contactId: string): Promise<SupplierContactDto> {
    const existing = await this.repository.findBySupplierAndContactId(supplierId, contactId);
    if (!existing) throw new NotFoundException('Supplier contact not found.');

    const updated = await this.repository.transaction(async (tx) => {
      await this.repository.clearPrimaryBySupplierId(supplierId, tx);
      const row = await this.repository.updateContact(contactId, { isPrimary: true }, tx);
      await this.repository.syncSupplierPrimaryContact(
        supplierId,
        { name: row.name, phone: row.phone ?? null, email: row.email ?? null },
        tx,
      );
      return row;
    });

    return SupplierContactDto.from(updated);
  }

  async deleteContact(supplierId: string, contactId: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findBySupplierAndContactId(supplierId, contactId);
    if (!existing) throw new NotFoundException('Supplier contact not found.');

    const totalContacts = await this.repository.countBySupplierId(supplierId);
    if (totalContacts <= 1) {
      throw new BadRequestException('A supplier must have at least one primary contact.');
    }
    if (existing.isPrimary) {
      throw new BadRequestException('Primary contact cannot be deleted. Mark another contact as primary first.');
    }

    await this.repository.deleteContact(contactId);
    return { success: true, message: `Supplier contact "${contactId}" removed successfully.` };
  }
}
