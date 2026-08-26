// WhatsApp account permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
//
// The account row is a CRUD record, so it keeps view/add/edit/delete. The two sub-resources are not
// stored here — phone numbers and message templates are read live from Meta — but they still carry
// their own codes, because managing what a business sends from is a meaningfully different grant
// from managing the connection itself:
//   `phoneNumbers.view`  the Phone Numbers tab
//   `phoneNumbers.edit`  add/verify/register numbers and edit a number's profile (picture, display name)
//   `templates.view`     the Message Templates tab
//   `templates.add`      submits a new template to Meta for approval (includes browsing Meta's library)
//   `templates.delete`   deletes a template from the WABA in Meta
export const ORG_WHATSAPP_ACCOUNTS = {
  featureCode: 'whatsapp-accounts',
  view: 'org.whatsapp-accounts.view',
  add: 'org.whatsapp-accounts.add',
  edit: 'org.whatsapp-accounts.edit',
  delete: 'org.whatsapp-accounts.delete',
  phoneNumbers: {
    view: 'org.whatsapp-accounts.phone-numbers.view',
    edit: 'org.whatsapp-accounts.phone-numbers.edit',
  },
  templates: {
    view: 'org.whatsapp-accounts.templates.view',
    add: 'org.whatsapp-accounts.templates.add',
    delete: 'org.whatsapp-accounts.templates.delete',
  },
} as const;
