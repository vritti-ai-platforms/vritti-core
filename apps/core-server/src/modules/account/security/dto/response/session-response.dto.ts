import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Session } from '@/db/schema';

// Parses a browser name from a user-agent string
function parseBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Microsoft Edge';
  if (/Chrome\//i.test(userAgent) && !/Chromium/i.test(userAgent)) return 'Chrome';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  if (/Safari\//i.test(userAgent) && !/Chrome/i.test(userAgent)) return 'Safari';
  if (/OPR\//i.test(userAgent) || /Opera\//i.test(userAgent)) return 'Opera';
  return 'Unknown Browser';
}

// Parses an OS name from a user-agent string
function parseOs(userAgent: string): string {
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macOS';
  if (/Linux/i.test(userAgent) && !/Android/i.test(userAgent)) return 'Linux';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  return 'Unknown OS';
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Session unique identifier' })
  sessionId: string;

  @ApiProperty({ description: 'Browser and OS parsed from user agent', example: 'Chrome on macOS' })
  device: string;

  @ApiPropertyOptional({ description: 'IP address of the session', example: '192.168.1.1', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'Session creation timestamp (ISO string)', example: '2024-06-01T08:00:00Z' })
  lastActive: string;

  @ApiProperty({ description: 'Whether this is the current active session', example: false })
  isCurrent: boolean;

  // Creates a SessionResponseDto from a Session entity, marking it as current if the token hash matches
  static from(session: Session, currentAccessTokenHash: string): SessionResponseDto {
    const dto = new SessionResponseDto();
    dto.sessionId = session.id;
    dto.ipAddress = session.ipAddress ?? null;
    dto.lastActive = session.createdAt.toISOString();
    dto.isCurrent = session.accessTokenHash === currentAccessTokenHash;

    const ua = session.userAgent ?? '';
    if (ua) {
      dto.device = `${parseBrowser(ua)} on ${parseOs(ua)}`;
    } else {
      dto.device = 'Unknown Device';
    }

    return dto;
  }
}
