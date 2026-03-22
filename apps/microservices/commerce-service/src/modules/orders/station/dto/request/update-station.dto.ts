import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateStationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
