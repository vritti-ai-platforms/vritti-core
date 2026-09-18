// SMS provider permission codes — MUST match the cloud catalog's authored codes exactly.
//
// The rows are CRUD records like WhatsApp accounts, so the standard four apply. They only govern
// an organization's own (CLIENT) rows — platform rows are read-only in core regardless of grants,
// managed exclusively from the cloud admin panel.
//
// `templates` is the sub-resource behind the provider detail page's Templates tab. Unlike WhatsApp
// templates — read live from Meta on every load — these are stored here, because MSG91 has no
// endpoint that lists the templates on an account (only `getVersions`, which needs an ID you
// already hold). Our rows ARE the list; MSG91 is consulted to validate and enrich each one:
//   `templates.view`    the Templates tab, and the refresh that re-reads one from the vendor
//   `templates.add`     registers a template ID against the provider after the vendor confirms it
//   `templates.delete`  forgets our row — never deletes anything at the vendor
export const ORG_SMS_PROVIDERS = {
  featureCode: 'sms-providers',
  view: 'org.sms-providers.view',
  add: 'org.sms-providers.add',
  edit: 'org.sms-providers.edit',
  delete: 'org.sms-providers.delete',
  templates: {
    view: 'org.sms-providers.templates.view',
    add: 'org.sms-providers.templates.add',
    delete: 'org.sms-providers.templates.delete',
  },
} as const;
