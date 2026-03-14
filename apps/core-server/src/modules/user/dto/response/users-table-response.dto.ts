import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../entity/user.dto';

export class UsersTableResponseDto {
  @ApiProperty({ type: [UserDto], description: 'Paginated user results' })
  result: UserDto[];

  @ApiProperty({ description: 'Total number of matching users', example: 42 })
  count: number;
}
