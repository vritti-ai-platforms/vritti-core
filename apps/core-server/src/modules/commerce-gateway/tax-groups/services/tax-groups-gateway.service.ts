import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { CreateTaxGroupDto } from '../dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from '../dto/request/update-tax-group.dto';
import type { TaxGroupResponseDto } from '../dto/response/tax-group-response.dto';

@Injectable()
export class TaxGroupsGatewayService {
  private readonly logger = new Logger(TaxGroupsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns all tax groups for the given BU
  async list(): Promise<TaxGroupResponseDto[]> {
    this.logger.log('taxGroups.list');
    return this.nats.send('commerce', 'taxGroups.list');
  }

  // Creates a new tax group
  async create(dto: CreateTaxGroupDto): Promise<TaxGroupResponseDto> {
    this.logger.log(`taxGroups.create — name: ${dto.name}`);
    return this.nats.send('commerce', 'taxGroups.create', dto);
  }

  // Finds a tax group by ID
  async findById(id: string): Promise<TaxGroupResponseDto> {
    this.logger.log(`taxGroups.findById — id: ${id}`);
    return this.nats.send('commerce', 'taxGroups.findById', { id });
  }

  // Updates a tax group by ID
  async update(id: string, dto: UpdateTaxGroupDto): Promise<TaxGroupResponseDto> {
    this.logger.log(`taxGroups.update — id: ${id}`);
    return this.nats.send('commerce', 'taxGroups.update', { id, ...dto });
  }

  // Deletes a tax group by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    this.logger.log(`taxGroups.delete — id: ${id}`);
    return this.nats.send('commerce', 'taxGroups.delete', { id });
  }
}
