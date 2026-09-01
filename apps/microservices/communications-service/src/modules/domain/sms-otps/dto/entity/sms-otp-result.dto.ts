export interface PreparedOtp {
  id: string | null;
  code: string | null;
  expiresAt: Date;
  resendAvailableAt: Date;
}

export class SendSmsOtpResultDto {
  sent: boolean;
  expiresAt: string;
  resendAvailableAt: string;

  static from(sent: boolean, prepared: PreparedOtp): SendSmsOtpResultDto {
    const dto = new SendSmsOtpResultDto();
    dto.sent = sent;
    dto.expiresAt = prepared.expiresAt.toISOString();
    dto.resendAvailableAt = prepared.resendAvailableAt.toISOString();
    return dto;
  }
}

export class VerifySmsOtpResultDto {
  verified: boolean;
}
