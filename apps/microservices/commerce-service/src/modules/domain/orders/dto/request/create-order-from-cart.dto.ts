import { IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

export class CreateOrderFromCartDto {
  // The catalogue the shopper buys from — fixes which listings and prices the basket reads
  @IsUUID()
  appId: string;

  @IsUUID()
  partyId: string;

  // ISO 4217.
  // ISO 4217. The currency the basket is priced and the order is charged in
  @IsString()
  @Length(3, 3)
  currencyCode: string;

  // One of the party's own addresses.
  // One of the party's own addresses. Present makes this a delivery order
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  // The checkout's idempotency key.
  // The checkout's idempotency key. A repeat with the same key returns the order already opened for it
  @IsOptional()
  @IsString()
  @MaxLength(100)
  idempotencyKey?: string;
}
