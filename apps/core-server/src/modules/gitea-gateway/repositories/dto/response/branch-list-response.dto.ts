import { ApiProperty } from '@nestjs/swagger';

export interface GiteaApiBranch {
  name: string;
  protected: boolean;
}

export class BranchListResponseDto {
  @ApiProperty({ type: [String], example: ['main', 'feature/hero'] })
  items: string[];

  // Creates a DTO from a raw Gitea branch list.
  static from(branches: GiteaApiBranch[] | null): BranchListResponseDto {
    const dto = new BranchListResponseDto();
    dto.items = (branches ?? []).map((branch) => branch.name);
    return dto;
  }
}
