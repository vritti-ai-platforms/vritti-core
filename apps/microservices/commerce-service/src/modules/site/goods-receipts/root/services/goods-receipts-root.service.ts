import type { GoodsReceiptDto } from '@domain/goods-receipts/dto/entity/goods-receipt.dto';
import type { CreateGoodsReceiptDto } from '@domain/goods-receipts/dto/request/create-goods-receipt.dto';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import { SupplierSitesDomainService } from '@domain/supplier-sites/services/supplier-sites.service';
import { SuppliersDomainRepository } from '@domain/suppliers/repositories/suppliers.repository';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto } from '@vritti/api-sdk/database';
import { BadRequestException, NotFoundException } from '@vritti/api-sdk/exceptions';

@Injectable()
export class GoodsReceiptsService {
  private readonly logger = new Logger(GoodsReceiptsService.name);

  constructor(
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly suppliersRepository: SuppliersDomainRepository,
    private readonly supplierSitesService: SupplierSitesDomainService,
  ) {}

  // Creates a goods receipt after gating the supplier on purchasing-block + site enrollment
  async create(
    dto: CreateGoodsReceiptDto,
    siteId: string,
    siteCurrencyCode: string,
  ): Promise<CreateResponseDto<GoodsReceiptDto>> {
    const supplier = await this.suppliersRepository.findById(dto.supplierId);
    if (!supplier) throw new NotFoundException('Supplier not found.');
    if (supplier.purchasingBlocked) {
      throw new BadRequestException({
        label: 'Supplier Blocked',
        detail: 'Purchasing is blocked for this supplier.',
      });
    }
    const enrolled = await this.supplierSitesService.isEnrolled(dto.supplierId, siteId);
    if (!enrolled) {
      throw new BadRequestException({
        label: 'Supplier Not Enrolled',
        detail: 'Supplier is not enrolled for this site. Enroll the supplier before creating this document.',
      });
    }
    this.logger.log(`goodsReceipts.create — supplier: ${dto.supplierId}`);
    return this.goodsReceiptsService.create(dto, siteCurrencyCode);
  }
}
