import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { LocationRoleValues } from '../../constants/location-role.constants';

const LOCATION_ROLE_VALUES = Object.values(LocationRoleValues);
const LOCATION_ROLES_CSV_REGEX = new RegExp(`^(${LOCATION_ROLE_VALUES.join('|')})(,(${LOCATION_ROLE_VALUES.join('|')}))*$`);

export class LocationsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated location roles to filter options by',
    example: 'STORAGE,RESERVED_STORAGE',
  })
  @IsOptional()
  @IsString()
  @Matches(LOCATION_ROLES_CSV_REGEX, { message: `locationRoles must be a comma-separated subset of: ${LOCATION_ROLE_VALUES.join(', ')}` })
  locationRoles?: string;

  @ApiPropertyOptional({
    description: 'Optional inventory item context (passed through; reserved for future per-item filtering).',
    example: 'b3f9a8c4-1234-4567-89ab-cdef01234567',
  })
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;
}
