const URL_PATTERN = /https?:\/\/[^\s"'<>)]+/g;

export interface ConsoleEmailOptions {
  fromName?: string;
  fromAddress?: string;
}

// Writes mail to the terminal, links first.
export function consoleEmailAdapter(options: ConsoleEmailOptions = {}) {
  return ({ payload }: { payload: { logger?: { info: (message: string) => void } } }) => ({
    name: 'console',
    defaultFromName: options.fromName ?? 'Vritti',
    defaultFromAddress: options.fromAddress ?? 'no-reply@localhost',

    sendEmail: async (message: Record<string, unknown>): Promise<void> => {
      const body = [message.html, message.text].filter((part): part is string => typeof part === 'string').join('\n');
      const links = [...new Set(body.match(URL_PATTERN) ?? [])];

      const lines = [
        '',
        '─── email (not sent — console adapter) ───',
        `to:      ${stringifyTo(message.to)}`,
        `subject: ${typeof message.subject === 'string' ? message.subject : '(none)'}`,
        // The point of the whole adapter.
        ...(links.length > 0 ? ['', 'links:', ...links.map((link) => `  ${link}`)] : []),
        '',
        stripTags(body).trim(),
        '─────────────────────────────────────────',
        '',
      ];

      const text = lines.join('\n');

      // Called as a method, never lifted into a variable first: payload's logger is pino, which reads its own
      // configuration off `this`, so a detached `logger.info` throws on `Symbol(pino.msgPrefix)`.
      if (payload.logger) payload.logger.info(text);
      else process.stdout.write(`${text}\n`);
    },
  });
}

// Payload hands `to` as a string, an address object, or a list of either.
function stringifyTo(to: unknown): string {
  if (typeof to === 'string') return to;
  if (Array.isArray(to)) return to.map(stringifyTo).join(', ');
  if (to && typeof to === 'object' && 'address' in to) return String((to as { address: unknown }).address);
  return '(none)';
}

// Enough to make a templated email readable in a terminal.
function stripTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
}
