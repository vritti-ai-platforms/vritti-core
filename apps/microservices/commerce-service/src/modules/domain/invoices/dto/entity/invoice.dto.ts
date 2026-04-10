import type { Invoice, InvoiceItem } from '@/db/schema';

export class InvoiceItemDto {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  total: number;
  referenceItemId: string | null;

  static from(entity: InvoiceItem): InvoiceItemDto {
    const dto = new InvoiceItemDto();
    dto.id = entity.id;
    dto.description = entity.description;
    dto.quantity = Number(entity.quantity);
    dto.unitPrice = Number(entity.unitPrice);
    dto.taxAmount = Number(entity.taxAmount);
    dto.total = Number(entity.total);
    dto.referenceItemId = entity.referenceItemId ?? null;
    return dto;
  }
}

export class InvoiceDto {
  id: string;
  type: string;
  invoiceNumber: string;
  partyType: string;
  partyId: string | null;
  partyName: string;
  referenceType: string | null;
  referenceId: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
  paymentTerms: string | null;
  issuedDate: string | null;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  static from(entity: Invoice): InvoiceDto {
    const dto = new InvoiceDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.invoiceNumber = entity.invoiceNumber;
    dto.partyType = entity.partyType;
    dto.partyId = entity.partyId ?? null;
    dto.partyName = entity.partyName;
    dto.referenceType = entity.referenceType ?? null;
    dto.referenceId = entity.referenceId ?? null;
    dto.subtotal = Number(entity.subtotal);
    dto.taxAmount = Number(entity.taxAmount);
    dto.discountAmount = Number(entity.discountAmount);
    dto.totalAmount = Number(entity.totalAmount);
    dto.paidAmount = Number(entity.paidAmount);
    dto.balance = Number(entity.balance);
    dto.status = entity.status;
    dto.paymentTerms = entity.paymentTerms ?? null;
    dto.issuedDate = entity.issuedDate ?? null;
    dto.dueDate = entity.dueDate ?? null;
    dto.notes = entity.notes ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class InvoiceDetailDto extends InvoiceDto {
  items: InvoiceItemDto[];

  static fromDetail(entity: Invoice, items: InvoiceItemDto[]): InvoiceDetailDto {
    const dto = new InvoiceDetailDto();
    Object.assign(dto, InvoiceDto.from(entity));
    dto.items = items;
    return dto;
  }
}
