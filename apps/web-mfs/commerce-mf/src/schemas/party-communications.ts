import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

const COMMUNICATION_CHANNELS = ['EMAIL', 'PHONE'] as const;

export type CommunicationChannel = (typeof COMMUNICATION_CHANNELS)[number];

export const communicationChannelSchema = z.enum(COMMUNICATION_CHANNELS);

export const COMMUNICATION_CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  EMAIL: 'Email',
  PHONE: 'Phone',
};

export const COMMUNICATION_CHANNEL_OPTIONS = COMMUNICATION_CHANNELS.map((value) => ({
  value,
  label: COMMUNICATION_CHANNEL_LABELS[value],
}));

const MESSAGING_APPS = ['WHATSAPP', 'TELEGRAM', 'SIGNAL', 'IMO', 'VIBER', 'WECHAT'] as const;

export type MessagingApp = (typeof MESSAGING_APPS)[number];

export const MESSAGING_APP_LABELS: Record<MessagingApp, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  SIGNAL: 'Signal',
  IMO: 'imo',
  VIBER: 'Viber',
  WECHAT: 'WeChat',
};

export const MESSAGING_APP_OPTIONS = MESSAGING_APPS.map((value) => ({
  value,
  label: MESSAGING_APP_LABELS[value],
}));

export const communicationAppSchema = z.object({
  app: z.enum(MESSAGING_APPS),
  handle: z.string().max(255).nullish(),
});

export type CommunicationApp = z.infer<typeof communicationAppSchema>;

export interface PartyCommunicationApp {
  app: MessagingApp;
  handle: string | null;
}

export const communicationSchema = z
  .object({
    channel: communicationChannelSchema,
    value: z.string().min(1, 'Value is required').max(255, 'Value must be at most 255 characters'),
    isPrimary: z.boolean().optional(),
    isActive: z.boolean().optional(),
    apps: z.array(communicationAppSchema),
  })
  .superRefine((data, ctx) => {
    if (data.channel === 'EMAIL' && !z.string().email().safeParse(data.value).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid email', path: ['value'] });
    }
  });

export type CommunicationFormData = z.infer<typeof communicationSchema>;

export interface PartyCommunicationPayload {
  channel: CommunicationChannel;
  value: string;
  isPrimary?: boolean;
  isActive?: boolean;
  apps?: PartyCommunicationApp[];
}

export interface PartyCommunicationUpdatePayload {
  value?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  apps?: PartyCommunicationApp[];
}

export interface PartyCommunicationRow {
  id: string;
  partyId: string;
  channel: CommunicationChannel;
  value: string;
  isPrimary: boolean;
  isActive: boolean;
  apps: PartyCommunicationApp[];
  createdAt: string;
}

export type PartyCommunicationsTableResponse = TableResponse<PartyCommunicationRow>;
