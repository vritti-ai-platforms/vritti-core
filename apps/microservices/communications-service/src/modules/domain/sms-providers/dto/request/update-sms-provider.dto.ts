import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

// The provider code is immutable — switching vendors is a new row, not an edit (in-flight OTPs
// reference this row's provider for stats)
export class UpdateSmsProviderDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  // Full replacement when present — partial credential merges would let stale keys linger
  @IsOptional()
  @IsObject()
  credentials?: Record<string, unknown>;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(64)
  senderId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
