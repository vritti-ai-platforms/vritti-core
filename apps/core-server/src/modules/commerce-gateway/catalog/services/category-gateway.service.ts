import { Inject, Injectable } from '@nestjs/common';
import { type ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import { COMMERCE_SERVICE } from '../../commerce-client.module';
import type { CreateCategoryDto } from '../dto/request/create-category.dto';
import type { UpdateCategoryDto } from '../dto/request/update-category.dto';

@Injectable()
export class CategoryGatewayService {
  constructor(@Inject(COMMERCE_SERVICE) private readonly client: ClientProxy) {}

  // Forwards findAll to commerce-service via NATS
  findAll(organizationId: string, businessUnitId: string): Observable<unknown> {
    return this.client.send('commerce.categories.findAll', { organizationId, businessUnitId });
  }

  // Forwards findById to commerce-service via NATS
  findById(id: string): Observable<unknown> {
    return this.client.send('commerce.categories.findById', { id });
  }

  // Forwards create to commerce-service via NATS
  create(dto: CreateCategoryDto & { organizationId: string }): Observable<unknown> {
    return this.client.send('commerce.categories.create', dto);
  }

  // Forwards update to commerce-service via NATS
  update(id: string, dto: UpdateCategoryDto): Observable<unknown> {
    return this.client.send('commerce.categories.update', { id, ...dto });
  }

  // Forwards delete to commerce-service via NATS
  delete(id: string): Observable<unknown> {
    return this.client.send('commerce.categories.delete', { id });
  }
}
