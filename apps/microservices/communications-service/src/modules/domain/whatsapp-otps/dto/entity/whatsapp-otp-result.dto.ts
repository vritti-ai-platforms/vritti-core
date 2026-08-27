export interface PreparedOtp {
  id: string | null;
  code: string | null;
  expiresAt: Date;
  resendAvailableAt: Date;
}

export class SendWhatsappOtpResultDto {
  sent: boolean;
  expiresAt: string;
  resendAvailableAt: string;

  static from(sent: boolean, prepared: PreparedOtp): SendWhatsappOtpResultDto {
    const dto = new SendWhatsappOtpResultDto();
    dto.sent = sent;
    dto.expiresAt = prepared.expiresAt.toISOString();
    dto.resendAvailableAt = prepared.resendAvailableAt.toISOString();
    return dto;
  }
}

export class VerifyWhatsappOtpResultDto {
  verified: boolean;
}
