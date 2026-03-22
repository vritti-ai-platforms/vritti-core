import { Inject, Injectable } from '@nestjs/common';
import { type ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import { COMMERCE_SERVICE } from '../../commerce-client.module';
import type { AddOrderItemsDto } from '../dto/request/add-order-items.dto';
import type { CreateOrderDto } from '../dto/request/create-order.dto';

@Injectable()
export class OrderGatewayService {
  constructor(@Inject(COMMERCE_SERVICE) private readonly client: ClientProxy) {}

  // Forwards findAll to commerce-service via NATS
  findAll(query: {
    organizationId: string;
    businessUnitId: string;
    status?: string;
    source?: string;
  }): Observable<unknown> {
    return this.client.send('commerce.orders.findAll', query);
  }

  // Forwards findById to commerce-service via NATS
  findById(id: string): Observable<unknown> {
    return this.client.send('commerce.orders.findById', { id });
  }

  // Forwards create to commerce-service via NATS
  create(dto: CreateOrderDto & { organizationId: string }): Observable<unknown> {
    return this.client.send('commerce.orders.create', dto);
  }

  // Forwards updateStatus to commerce-service via NATS
  updateStatus(id: string, status: string): Observable<unknown> {
    return this.client.send('commerce.orders.updateStatus', { id, status });
  }

  // Forwards addItems to commerce-service via NATS
  addItems(orderId: string, dto: AddOrderItemsDto): Observable<unknown> {
    return this.client.send('commerce.orders.addItems', { orderId, ...dto });
  }

  // Forwards updateItemStatus to commerce-service via NATS
  updateItemStatus(itemId: string, status: string): Observable<unknown> {
    return this.client.send('commerce.orders.updateItemStatus', { itemId, status });
  }
}
