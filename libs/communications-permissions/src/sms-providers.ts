// SMS provider permission codes — MUST match the cloud catalog's authored codes exactly.
//
// The rows are CRUD records like WhatsApp accounts, so the standard four apply. They only govern
// an organization's own (CLIENT) rows — platform rows are read-only in core regardless of grants,
// managed exclusively from the cloud admin panel.
export const ORG_SMS_PROVIDERS = {
  featureCode: 'sms-providers',
  view: 'org.sms-providers.view',
  add: 'org.sms-providers.add',
  edit: 'org.sms-providers.edit',
  delete: 'org.sms-providers.delete',
} as const;
