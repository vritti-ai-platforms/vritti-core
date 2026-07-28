import { ApiProperty } from '@nestjs/swagger';
import { RepositoryResponseDto } from './repository-response.dto';

// Not a TableResponseDto: Gitea owns pagination and offers no server-side filter/sort state,
// so there is no view state to round-trip.
export class RepositoryListResponseDto {
  @ApiProperty({ type: [RepositoryResponseDto] })
  items: RepositoryResponseDto[];

  @ApiProperty({ example: 42, description: 'Total repositories in the git namespace' })
  total: number;

  // Creates a paginated DTO from raw Gitea repositories and the X-Total-Count header
  static from(items: RepositoryResponseDto[], total: number): RepositoryListResponseDto {
    const dto = new RepositoryListResponseDto();
    dto.items = items;
    dto.total = total;
    return dto;
  }
}
