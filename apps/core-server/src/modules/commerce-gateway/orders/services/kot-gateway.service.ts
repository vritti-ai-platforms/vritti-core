import { Inject, Injectable } from '@nestjs/common';
import { type ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import { COMMERCE_SERVICE } from '../../commerce-client.module';

@Injectable()
export class KotGatewayService {
  constructor(@Inject(COMMERCE_SERVICE) private readonly client: ClientProxy) {}

  // Forwards findActive to commerce-service via NATS
  findActive(organizationId: string, businessUnitId: string): Observable<unknown> {
    return this.client.send('commerce.kot.findActive', { organizationId, businessUnitId });
  }

  // Forwards updateItemStatus to commerce-service via NATS
  updateItemStatus(itemId: string, status: string): Observable<unknown> {
    return this.client.send('commerce.kot.updateItemStatus', { itemId, status });
  }
}
