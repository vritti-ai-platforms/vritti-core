import { ApiProperty } from '@nestjs/swagger';

// Raw branch shape returned by the Gitea REST API. Only the name is mapped — nothing renders the
// protection flags or commit payload yet, so they are left off the response DTO.
export interface GiteaApiBranch {
  name: string;
  protected: boolean;
}

export class BranchListResponseDto {
  @ApiProperty({ type: [String], example: ['main', 'feature/hero'] })
  items: string[];

  // Creates a DTO from a raw Gitea branch list. Gitea answers `null` rather than an empty array for a
  // repository with no commits, and getOrNull() also yields null on a 404.
  static from(branches: GiteaApiBranch[] | null): BranchListResponseDto {
    const dto = new BranchListResponseDto();
    dto.items = (branches ?? []).map((branch) => branch.name);
    return dto;
  }
}
