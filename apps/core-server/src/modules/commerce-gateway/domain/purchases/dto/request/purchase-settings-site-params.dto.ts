import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';

export class PurchaseSettingsSiteParamsDto {
  @ApiProperty({ description: "One of the legal entity's sites" })
  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
