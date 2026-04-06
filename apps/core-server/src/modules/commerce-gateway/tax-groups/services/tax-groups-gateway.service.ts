import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { UserService } from '@domain/user/services/user.service';
import { COMMERCE_SERVICE } from '../../commerce-client.module';
import type { CreateTaxGroupDto } from '../dto/request/create-tax-group.dto';
import type { UpdateTaxGroupDto } from '../dto/request/update-tax-group.dto';
import type { TaxGroupResponseDto } from '../dto/response/tax-group-response.dto';

@Injectable()
export class TaxGroupsGatewayService {
  private readonly logger = new Logger(TaxGroupsGatewayService.name);

  constructor(
    @Inject(COMMERCE_SERVICE) private readonly client: ClientProxy,
    private readonly userService: UserService,
  ) {}

  // Returns all tax groups for the user's org + given BU
  async list(userId: string, buId: string): Promise<TaxGroupResponseDto[]> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<TaxGroupResponseDto[]>({ cmd: 'taxGroups.list' }, { organizationId: user.organizationId, businessUnitId: buId })
      .toPromise() as Promise<TaxGroupResponseDto[]>;
  }

  // Creates a new tax group, resolving organizationId from the authenticated user
  async create(userId: string, dto: CreateTaxGroupDto): Promise<TaxGroupResponseDto> {
    const user = await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<TaxGroupResponseDto>({ cmd: 'taxGroups.create' }, { organizationId: user.organizationId, ...dto })
      .toPromise() as Promise<TaxGroupResponseDto>;
  }

  // Finds a tax group by ID
  async findById(id: string): Promise<TaxGroupResponseDto> {
    return this.client
      .send<TaxGroupResponseDto>({ cmd: 'taxGroups.findById' }, { id })
      .toPromise() as Promise<TaxGroupResponseDto>;
  }

  // Updates a tax group by ID
  async update(userId: string, id: string, dto: UpdateTaxGroupDto): Promise<TaxGroupResponseDto> {
    await this.userService.findByIdOrThrow(userId);
    return this.client
      .send<TaxGroupResponseDto>({ cmd: 'taxGroups.update' }, { id, ...dto })
      .toPromise() as Promise<TaxGroupResponseDto>;
  }

  // Deletes a tax group by ID
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return this.client
      .send<{ success: boolean; message: string }>({ cmd: 'taxGroups.delete' }, { id })
      .toPromise() as Promise<{ success: boolean; message: string }>;
  }
}
