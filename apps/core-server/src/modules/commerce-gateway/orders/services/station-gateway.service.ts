import { Inject, Injectable } from '@nestjs/common';
import { type ClientProxy } from '@nestjs/microservices';
import type { Observable } from 'rxjs';
import { COMMERCE_SERVICE } from '../../commerce-client.module';
import type { CreateStationDto } from '../dto/request/create-station.dto';
import type { UpdateStationDto } from '../dto/request/update-station.dto';

@Injectable()
export class StationGatewayService {
  constructor(@Inject(COMMERCE_SERVICE) private readonly client: ClientProxy) {}

  // Forwards findAll to commerce-service via NATS
  findAll(organizationId: string, businessUnitId: string): Observable<unknown> {
    return this.client.send('commerce.stations.findAll', { organizationId, businessUnitId });
  }

  // Forwards findById to commerce-service via NATS
  findById(id: string): Observable<unknown> {
    return this.client.send('commerce.stations.findById', { id });
  }

  // Forwards create to commerce-service via NATS
  create(dto: CreateStationDto & { organizationId: string }): Observable<unknown> {
    return this.client.send('commerce.stations.create', dto);
  }

  // Forwards update to commerce-service via NATS
  update(id: string, dto: UpdateStationDto): Observable<unknown> {
    return this.client.send('commerce.stations.update', { id, ...dto });
  }

  // Forwards delete to commerce-service via NATS
  delete(id: string): Observable<unknown> {
    return this.client.send('commerce.stations.delete', { id });
  }
}
