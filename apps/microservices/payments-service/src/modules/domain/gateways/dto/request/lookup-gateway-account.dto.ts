import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';

// Asks a gateway whether a seller's account id exists under a config's keys
export class LookupGatewayAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gatewayCode: string;

  @IsObject()
  credentials: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  providerAccountId: string;
}
