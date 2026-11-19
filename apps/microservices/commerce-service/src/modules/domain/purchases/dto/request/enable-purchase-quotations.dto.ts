import { IsInt, IsUUID, Min } from 'class-validator';

export class EnablePurchaseQuotationsDto {
  @IsUUID('7')
  id: string;

  @IsInt()
  @Min(1)
  minQuotations: number;
}
