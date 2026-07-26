import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartyFunctionResponseDto } from '@/modules/commerce-gateway/_shared/dto/party-function-assignment.dto';

export class PartyAddressResponseDto {
  @ApiProperty({ description: 'Address ID' })
  id: string;

  @ApiProperty({ description: 'The party ID the address belongs to' })
  partyId: string;

  @ApiProperty({ description: 'Address line 1' })
  line1: string;

  @ApiPropertyOptional({ description: 'Address line 2', nullable: true })
  line2: string | null;

  @ApiPropertyOptional({ description: 'City', nullable: true })
  city: string | null;

  @ApiPropertyOptional({ description: 'Region, state, or province', nullable: true })
  region: string | null;

  @ApiPropertyOptional({ description: 'Postal or ZIP code', nullable: true })
  postalCode: string | null;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code' })
  countryCode: string;

  @ApiProperty({ description: 'Whether the address is active' })
  isActive: boolean;

  @ApiProperty({ type: [PartyFunctionResponseDto], description: 'Address functions assigned to this address' })
  functions: PartyFunctionResponseDto[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;
}
