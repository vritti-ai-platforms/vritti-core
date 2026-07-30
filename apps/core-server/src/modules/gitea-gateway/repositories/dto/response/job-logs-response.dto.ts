import { ApiProperty } from '@nestjs/swagger';

// Build logs can reach megabytes. Capped because this is a viewing surface, not a download one.
const MAX_LOG_BYTES = 1024 * 1024;

export class JobLogsResponseDto {
  @ApiProperty({ description: 'Raw log text; lines are RFC3339-prefixed and may carry ::group:: markers' })
  content: string;

  @ApiProperty({ example: false, description: 'True when leading output was dropped to fit the cap' })
  isTruncated: boolean;

  // Keeps the END of an oversized log, not the start: a failure's cause is at the tail, and the header
  // Gitea writes at the top (runner info, OS) is the least useful part to preserve.
  static from(content: string): JobLogsResponseDto {
    const dto = new JobLogsResponseDto();
    dto.isTruncated = content.length > MAX_LOG_BYTES;
    dto.content = dto.isTruncated ? content.slice(content.length - MAX_LOG_BYTES) : content;
    return dto;
  }
}
