import { graphql } from '../gql/index.js';

export const SEND_WHATSAPP_OTP = graphql(`
  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {
    sendWhatsappOtp(input: $input) {
      sent
      expiresAt
      resendAvailableAt
      codeLength
    }
  }
`);

export const VERIFY_WHATSAPP_OTP = graphql(`
  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {
    verifyWhatsappOtp(input: $input) {
      verified
    }
  }
`);

// The SMS siblings — same shapes, delivered through the credential's configured SMS provider
export const SEND_SMS_OTP = graphql(`
  mutation SendSmsOtp($input: SendSmsOtpInput!) {
    sendSmsOtp(input: $input) {
      sent
      expiresAt
      resendAvailableAt
      codeLength
    }
  }
`);

export const VERIFY_SMS_OTP = graphql(`
  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {
    verifySmsOtp(input: $input) {
      verified
    }
  }
`);
