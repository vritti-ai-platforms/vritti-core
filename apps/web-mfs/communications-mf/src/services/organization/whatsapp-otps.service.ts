import { axios } from '@vritti/quantum-ui/axios';
import type { ConfiguredOtpAppData, WhatsappOtpStatsData, WhatsappOtpsTableResponse } from '@/schemas/whatsapp-otps';

// Fetches the sign-in codes table — the server reads the pushed table state and paginates itself
export function getWhatsappOtpsTable(): Promise<WhatsappOtpsTableResponse> {
  return axios.get<WhatsappOtpsTableResponse>('communications-api/whatsapp-otps/table').then((r) => r.data);
}

// Fetches the last 30 days of aggregates for the Overview tab
export function getWhatsappOtpStats(): Promise<WhatsappOtpStatsData> {
  return axios.get<WhatsappOtpStatsData>('communications-api/whatsapp-otps/stats').then((r) => r.data);
}

// Fetches the apps set up to send sign-in codes
export function getConfiguredOtpApps(): Promise<ConfiguredOtpAppData[]> {
  return axios.get<ConfiguredOtpAppData[]>('communications-api/whatsapp-otps/configured-apps').then((r) => r.data);
}
