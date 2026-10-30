import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';

export class LookupLinkedAccountDto {
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
