import { ApiProperty } from '@nestjs/swagger';

export class PermissionRouteDto {
  @ApiProperty()
  remoteEntry: string;

  @ApiProperty()
  exposedModule: string;

  @ApiProperty()
  routePrefix: string;
}

export class PermissionFeatureDto {
  @ApiProperty({ example: 'inventory' })
  code: string;

  @ApiProperty({ example: 'Inventory' })
  name: string;

  @ApiProperty({ example: 'box', nullable: true })
  icon: string | null;

  @ApiProperty({ example: ['VIEW', 'CREATE', 'EDIT'] })
  permissions: string[];

  @ApiProperty({ type: PermissionRouteDto })
  route: PermissionRouteDto;
}

export class PermissionsResponseDto {
  @ApiProperty({ type: [PermissionFeatureDto] })
  features: PermissionFeatureDto[];
}
