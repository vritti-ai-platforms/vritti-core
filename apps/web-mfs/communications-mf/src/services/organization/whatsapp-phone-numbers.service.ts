import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  AddWhatsappPhoneNumberData,
  RequestPhoneCodeData,
  UpdateProfilePictureData,
  WhatsappPhoneNumberData,
  WhatsappPhoneNumberProfileData,
  WhatsappPhoneNumbersTableResponse,
} from '@/schemas/whatsapp-phone-numbers';

// Fetches the WABA's phone numbers table — rows are read live from Meta
export function getWhatsappPhoneNumbersTable(accountId: string): Promise<WhatsappPhoneNumbersTableResponse> {
  return axios
    .get<WhatsappPhoneNumbersTableResponse>(`communications-api/whatsapp-accounts/${accountId}/phone-numbers/table`)
    .then((r) => r.data);
}

// Adds a phone number to the WABA — it must then be verified and registered before it can send
export function addWhatsappPhoneNumber(
  accountId: string,
  data: AddWhatsappPhoneNumberData,
): Promise<CreateResponse<WhatsappPhoneNumberData>> {
  return axios
    .post<CreateResponse<WhatsappPhoneNumberData>>(
      `communications-api/whatsapp-accounts/${accountId}/phone-numbers`,
      data,
    )
    .then((r) => r.data);
}

// Asks Meta to deliver the ownership verification code by SMS or voice call
export function requestPhoneVerificationCode(
  accountId: string,
  phoneNumberId: string,
  data: RequestPhoneCodeData,
): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(
      `communications-api/whatsapp-accounts/${accountId}/phone-numbers/${phoneNumberId}/request-code`,
      data,
      { showSuccessToast: false },
    )
    .then((r) => r.data);
}

// Confirms ownership of the number with the delivered code
export function verifyPhoneNumberCode(
  accountId: string,
  phoneNumberId: string,
  code: string,
): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(
      `communications-api/whatsapp-accounts/${accountId}/phone-numbers/${phoneNumberId}/verify-code`,
      { code },
      { showSuccessToast: false },
    )
    .then((r) => r.data);
}

// Reads the number's business profile (picture, about, contact details) live from Meta
export function getWhatsappPhoneNumberProfile(
  accountId: string,
  phoneNumberId: string,
): Promise<WhatsappPhoneNumberProfileData> {
  return axios
    .get<WhatsappPhoneNumberProfileData>(
      `communications-api/whatsapp-accounts/${accountId}/phone-numbers/${phoneNumberId}/profile`,
    )
    .then((r) => r.data);
}

// Replaces the number's profile picture — applies immediately, pictures are not reviewed
export function updateWhatsappPhoneNumberProfilePicture(
  accountId: string,
  phoneNumberId: string,
  data: UpdateProfilePictureData,
): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(
      `communications-api/whatsapp-accounts/${accountId}/phone-numbers/${phoneNumberId}/profile-picture`,
      data,
    )
    .then((r) => r.data);
}

// Submits a display name change to Meta for review (nameStatus tracks the outcome)
export function requestWhatsappPhoneNumberNameChange(
  accountId: string,
  phoneNumberId: string,
  newDisplayName: string,
): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(
      `communications-api/whatsapp-accounts/${accountId}/phone-numbers/${phoneNumberId}/request-name-change`,
      { newDisplayName },
    )
    .then((r) => r.data);
}

// Registers the verified number for Cloud API messaging using the two-step PIN
export function registerWhatsappPhoneNumber(
  accountId: string,
  phoneNumberId: string,
  pin: string,
): Promise<SuccessResponse> {
  return axios
    .post<SuccessResponse>(
      `communications-api/whatsapp-accounts/${accountId}/phone-numbers/${phoneNumberId}/register`,
      { pin },
    )
    .then((r) => r.data);
}
