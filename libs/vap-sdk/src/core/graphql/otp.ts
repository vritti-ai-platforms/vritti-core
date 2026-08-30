import { graphql } from '../gql';

// Issues a code over WhatsApp, replacing whatever code was live for the number. The sender,
// template and code policy come from the calling credential's own config, never from an argument.
export const SEND_WHATSAPP_OTP = graphql(`
  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {
    sendWhatsappOtp(input: $input) {
      sent
      expiresAt
      resendAvailableAt
    }
  }
`);

// Checks a code. Every failure mode — wrong, expired, too many attempts, none outstanding — comes
// back as `verified: false` and nothing else, so the result cannot be read as an oracle for which
// numbers have codes in flight.
export const VERIFY_WHATSAPP_OTP = graphql(`
  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {
    verifyWhatsappOtp(input: $input) {
      verified
    }
  }
`);
