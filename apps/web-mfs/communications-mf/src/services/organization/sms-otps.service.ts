import { axios } from '@vritti/quantum-ui/axios';
import type { ConfiguredSmsOtpAppData, SmsOtpStatsData, SmsOtpsTableResponse } from '@/schemas/sms-otps';

// Fetches the sign-in codes table — the server reads the pushed table state and paginates itself
export function getSmsOtpsTable(): Promise<SmsOtpsTableResponse> {
  return axios.get<SmsOtpsTableResponse>('communications-api/sms-otps/table').then((r) => r.data);
}

// Fetches the last 30 days of aggregates for the Overview tab
export function getSmsOtpStats(): Promise<SmsOtpStatsData> {
  return axios.get<SmsOtpStatsData>('communications-api/sms-otps/stats').then((r) => r.data);
}

// Fetches the apps set up to send SMS sign-in codes
export function getConfiguredSmsOtpApps(): Promise<ConfiguredSmsOtpAppData[]> {
  return axios.get<ConfiguredSmsOtpAppData[]>('communications-api/sms-otps/configured-apps').then((r) => r.data);
}
