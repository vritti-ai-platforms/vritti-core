import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetSupplierItemsRequiredDto {
  @ApiProperty({
    description:
      "Buy the item at the site only from suppliers that have it set up there, whatever the site's own rule says; false " +
      "leaves it to the site's rule",
  })
  @IsBoolean()
  required: boolean;
}
