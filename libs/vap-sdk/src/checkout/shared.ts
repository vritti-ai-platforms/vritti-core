// Helpers the gateway plugins share. Internal: not an entry point of the package.

export function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function asText(value: unknown): string | undefined {
  if (typeof value === 'string') return value.length > 0 ? value : undefined;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

// Throws unless running in a browser — the plugins open pages, which a server cannot
export function requireBrowser(what: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error(`${what} runs in a browser — call it from client code.`);
  }
}

// Loads a gateway's script once per page, however many times a checkout opens
const loading = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  const existing = loading.get(src);
  if (existing) return existing;
  const promise = new Promise<void>((resolve, reject) => {
    const fail = () => {
      loading.delete(src);
      reject(new Error('The payment window could not be loaded. Check your connection and try again.'));
    };
    const present = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (present?.dataset.loaded === 'true') return resolve();
    const script = present ?? document.createElement('script');
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    });
    script.addEventListener('error', fail);
    if (!present) {
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }
  });
  loading.set(src, promise);
  return promise;
}

export type HostedForm = { action: string; method: 'POST'; fields: Record<string, string> };

// Posts a hosted-checkout form from the browser, leaving the page for the gateway's
export function submitHostedForm(form: HostedForm): void {
  requireBrowser('Submitting a checkout form');
  const element = document.createElement('form');
  element.method = form.method;
  element.action = form.action;
  element.style.display = 'none';
  for (const [name, value] of Object.entries(form.fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    element.appendChild(input);
  }
  document.body.appendChild(element);
  element.submit();
}
