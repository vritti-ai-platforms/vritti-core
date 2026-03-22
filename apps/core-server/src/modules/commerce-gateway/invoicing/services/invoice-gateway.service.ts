import { Inject, Injectable } from '@nestjs/common';
import { type ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import { COMMERCE_SERVICE } from '../../commerce-client.module';

@Injectable()
export class InvoiceGatewayService {
  constructor(@Inject(COMMERCE_SERVICE) private readonly client: ClientProxy) {}

  // Forwards generate to commerce-service via NATS
  generate(orderId: string): Observable<unknown> {
    return this.client.send('commerce.invoices.generate', { orderId });
  }

  // Forwards findAll to commerce-service via NATS
  findAll(organizationId: string, businessUnitId: string): Observable<unknown> {
    return this.client.send('commerce.invoices.findAll', { organizationId, businessUnitId });
  }

  // Forwards findById to commerce-service via NATS
  findById(id: string): Observable<unknown> {
    return this.client.send('commerce.invoices.findById', { id });
  }

  // Forwards updateStatus to commerce-service via NATS
  updateStatus(id: string, status: string): Observable<unknown> {
    return this.client.send('commerce.invoices.updateStatus', { id, status });
  }
}
