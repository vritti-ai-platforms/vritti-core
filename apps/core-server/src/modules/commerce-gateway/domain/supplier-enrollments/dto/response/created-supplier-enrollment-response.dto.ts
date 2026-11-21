import { ApiProperty } from '@nestjs/swagger';

export class CreatedSupplierEnrollmentResponseDto {
  @ApiProperty({ description: 'The new enrollment' })
  id: string;
}
