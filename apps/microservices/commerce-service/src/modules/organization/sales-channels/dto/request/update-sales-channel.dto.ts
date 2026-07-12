import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSalesChannelDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
