import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { IsLeSite } from '@/security/validators/is-le-site.validator';

export class PostSupplierQuotationSiteDto {
  @ApiProperty({ description: 'Site of the legal entity to post the quotation to' })
  @IsUUID('7')
  @IsLeSite()
  siteId: string;
}
