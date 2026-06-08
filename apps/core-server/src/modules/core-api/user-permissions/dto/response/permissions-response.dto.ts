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

  @ApiProperty({ example: 'cart.fill', description: 'iOS SF Symbol' })
  sfSymbol: string;

  @ApiProperty({ example: 'shopping_cart', description: 'Android Material Symbol' })
  materialSymbol: string;

  @ApiProperty({ example: ['VIEW', 'CREATE', 'EDIT'] })
  permissions: string[];

  @ApiProperty({ type: PermissionRouteDto })
  route: PermissionRouteDto;

  @ApiProperty({ example: 'commerce' })
  appCode: string;

  @ApiProperty({ example: 'Commerce' })
  appName: string;

  @ApiProperty({ example: 'shopping-cart', nullable: true })
  appIcon: string | null;

  @ApiProperty({ example: 10 })
  appSortOrder: number;
}
