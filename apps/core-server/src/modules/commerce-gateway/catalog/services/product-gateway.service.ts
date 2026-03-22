import { Inject, Injectable } from '@nestjs/common';
import { type ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import { COMMERCE_SERVICE } from '../../commerce-client.module';
import type { CreateProductDto } from '../dto/request/create-product.dto';
import type { UpdateProductDto } from '../dto/request/update-product.dto';

@Injectable()
export class ProductGatewayService {
  constructor(@Inject(COMMERCE_SERVICE) private readonly client: ClientProxy) {}

  // Forwards findAll to commerce-service via NATS
  findAll(organizationId: string, businessUnitId: string): Observable<unknown> {
    return this.client.send('commerce.products.findAll', { organizationId, businessUnitId });
  }

  // Forwards findById to commerce-service via NATS
  findById(id: string): Observable<unknown> {
    return this.client.send('commerce.products.findById', { id });
  }

  // Forwards create to commerce-service via NATS
  create(dto: CreateProductDto & { organizationId: string }): Observable<unknown> {
    return this.client.send('commerce.products.create', dto);
  }

  // Forwards update to commerce-service via NATS
  update(id: string, dto: UpdateProductDto): Observable<unknown> {
    return this.client.send('commerce.products.update', { id, ...dto });
  }

  // Forwards delete to commerce-service via NATS
  delete(id: string): Observable<unknown> {
    return this.client.send('commerce.products.delete', { id });
  }
}
