import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../entity/user.dto';

export class UsersTableResponseDto {
  @ApiProperty({ type: [UserDto] })
  result: UserDto[];

  @ApiProperty()
  count: number;
}
