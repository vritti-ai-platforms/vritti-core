export const SMS_OTPS_KEY = ['communications', 'sms-otps'] as const;

export const SMS_OTPS_TABLE_KEY = [...SMS_OTPS_KEY, 'table'] as const;

export const SMS_OTP_STATS_KEY = [...SMS_OTPS_KEY, 'stats'] as const;

export const CONFIGURED_SMS_OTP_APPS_KEY = [...SMS_OTPS_KEY, 'configured-apps'] as const;
