import { ApiProperty } from '@nestjs/swagger';

export class LockedPermissionDto {
  @ApiProperty({ example: 'delete' })
  code: string;

  @ApiProperty({ example: 'PLAN', enum: ['PLAN', 'SITE'], nullable: true })
  reason: 'PLAN' | 'SITE' | null;

  @ApiProperty({ example: ['pro'], description: 'Plan codes that would unlock this permission' })
  unlockPlans: string[];
}

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
  lucideIcon: string | null;

  @ApiProperty({ example: 'cart.fill', description: 'iOS SF Symbol' })
  sfSymbol: string;

  @ApiProperty({ example: 'shopping_cart', description: 'Android Material Symbol' })
  materialSymbol: string;

  @ApiProperty({ example: ['VIEW', 'CREATE', 'EDIT'] })
  permissions: string[];

  @ApiProperty({ example: false, description: 'Whole feature locked by plan/site' })
  locked: boolean;

  @ApiProperty({ example: 'PLAN', enum: ['PLAN', 'SITE'], nullable: true })
  lockReason: 'PLAN' | 'SITE' | null;

  @ApiProperty({ example: ['pro'], description: 'Plan codes that would unlock this feature' })
  unlockPlans: string[];

  @ApiProperty({ type: [LockedPermissionDto] })
  lockedPermissions: LockedPermissionDto[];

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
