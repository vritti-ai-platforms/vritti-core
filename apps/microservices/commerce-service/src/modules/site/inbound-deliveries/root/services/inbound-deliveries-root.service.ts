import type { InboundDeliveryDto } from '@domain/inbound-deliveries/dto/entity/inbound-delivery.dto';
import type { CreateInboundDeliveryDto } from '@domain/inbound-deliveries/dto/request/create-inbound-delivery.dto';
import type { SetInboundDeliveryStatusDto } from '@domain/inbound-deliveries/dto/request/set-inbound-delivery-status.dto';
import type { UpdateInboundDeliveryDto } from '@domain/inbound-deliveries/dto/request/update-inbound-delivery.dto';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { InboundDeliverySourceValues } from '@/db/schema';

@Injectable()
export class InboundDeliveriesService {
  private readonly logger = new Logger(InboundDeliveriesService.name);

  constructor(
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly purchasesService: PurchasesDomainService,
  ) {}

  // Creates a planned delivery of a supplier the site still buys from
  async create(dto: CreateInboundDeliveryDto): Promise<CreateResponseDto<InboundDeliveryDto>> {
    await this.supplierEnrollmentsService.assertPurchasable(dto.supplierId);
    this.logger.log(`inboundDeliveries.create — supplier: ${dto.supplierId}`);
    return this.deliveriesService.create(dto);
  }

  // Changes a delivery's details, keeping the supplier's delivery note unique and not dated after the delivery
  async update(dto: UpdateInboundDeliveryDto): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesService.findDetailOrThrow(dto.id);
    return this.deliveriesService.update(delivery, dto);
  }

  // Moves a delivery along its manual workflow
  async setStatus(dto: SetInboundDeliveryStatusDto): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesService.findDetailOrThrow(dto.id);
    return this.deliveriesService.setStatus(delivery, dto.status);
  }

  // Deletes a planned delivery without lines; one a purchase created behind its receipt or invoice goes with them (409)
  async delete(id: string): Promise<SuccessResponseDto> {
    const delivery = await this.deliveriesService.findDetailOrThrow(id);
    if (delivery.source !== InboundDeliverySourceValues.ANNOUNCED) {
      this.purchasesService.assertNotPartOfPurchase(`Inbound delivery "${delivery.deliveryNumber}"`, [
        delivery.purchaseNumber,
      ]);
    }
    return this.deliveriesService.delete(delivery);
  }
}
