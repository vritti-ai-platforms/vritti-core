// WhatsApp account permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
//
// The account row is a CRUD record, so it keeps view/add/edit/delete. The two sub-resources are not
// stored here — phone numbers and message templates are read live from Meta — but they still carry
// their own codes, because seeing which numbers a business owns and being able to send a live test
// message are meaningfully different grants from managing the connection itself:
//   `phoneNumbers.view`  the Phone Numbers tab
//   `templates.view`     the Message Templates tab
//   `templates.add`      submits a new template to Meta for approval
//   `templates.send`     sends a real, billable message to a recipient number
export const ORG_WHATSAPP_ACCOUNTS = {
  featureCode: 'whatsapp-accounts',
  view: 'org.whatsapp-accounts.view',
  add: 'org.whatsapp-accounts.add',
  edit: 'org.whatsapp-accounts.edit',
  delete: 'org.whatsapp-accounts.delete',
  phoneNumbers: {
    view: 'org.whatsapp-accounts.phone-numbers.view',
  },
  templates: {
    view: 'org.whatsapp-accounts.templates.view',
    add: 'org.whatsapp-accounts.templates.add',
    send: 'org.whatsapp-accounts.templates.send',
  },
} as const;
