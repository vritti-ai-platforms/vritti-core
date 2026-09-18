import { Alert } from '@vritti/quantum-ui/Alert';
import { DetailField } from '@vritti/quantum-ui/DetailField';
import { Typography } from '@vritti/quantum-ui/Typography';
import { readSmsTemplateDetails, type SmsProviderTemplateData } from '@/schemas/sms-provider-templates';

interface TemplateDetailsDialogProps {
  template: SmsProviderTemplateData;
}

/**
 * What the provider holds for this template, as of the last sync.
 *
 * The snapshot is an opaque vendor payload, so the known fields are read defensively and an
 * unrecognised shape falls back to the raw body — a provider whose response we have never seen
 * still shows something rather than nothing.
 */
export const TemplateDetailsDialog = ({ template }: TemplateDetailsDialogProps) => {
  const details = readSmsTemplateDetails(template.details);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailField label="Name" type="string" value={template.name} />
        <DetailField label="Template ID" type="string" value={template.templateId} mono />
        {details?.senderId && <DetailField label="Sender ID" type="string" value={details.senderId} mono />}
        {details?.dltId && <DetailField label="DLT template ID" type="string" value={details.dltId} mono />}
        {details?.version && <DetailField label="Version" type="string" value={details.version} />}
        {details?.smsType && <DetailField label="Type" type="string" value={details.smsType.toLowerCase()} />}
        <DetailField label="Last synced" type="dateTime" value={template.syncedAt} />
      </div>

      {details?.body && (
        <div className="flex flex-col gap-2">
          <Typography variant="body2" intent="muted">
            Message
          </Typography>
          {/* The approved body, placeholders unrendered — the placeholder name is what a send keys
              the code by, so it is worth seeing verbatim */}
          <p className="rounded-md border border-border bg-muted/50 p-3 text-sm whitespace-pre-wrap break-words">
            {details.body}
          </p>
        </div>
      )}

      {details?.rejectReason && (
        <Alert variant="destructive" title="Rejected by the provider" description={details.rejectReason} />
      )}

      {!details && (
        <div className="flex flex-col gap-2">
          <Typography variant="body2" intent="muted">
            Returned by the provider
          </Typography>
          {/* Wraps rather than scrolls sideways: a dialog that scrolls horizontally hides content
              behind an edge people do not think to drag */}
          <pre className="max-h-64 overflow-y-auto rounded-md border border-border bg-muted/50 p-3 text-xs whitespace-pre-wrap break-all">
            {JSON.stringify(template.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
