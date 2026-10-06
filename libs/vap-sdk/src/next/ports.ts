import type { OtpSignInPorts } from '@vritti/vap-sdk/payload';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * The three things only the framework can do, wired to Next.
 *
 * This is the only module in the package that imports Next, which is why it lives in its own tier
 * behind its own export: `core`, `payload` and `native` stay framework-free, and a React Native
 * consumer never loads this file.
 *
 * Not a server action — an ordinary function. The `'use server'` modules beside it call it.
 */
export function nextOtpPorts(): OtpSignInPorts {
  return {
    readCookie: async (name) => (await cookies()).get(name)?.value,
    writeCookie: async (name, value, options) => {
      const store = await cookies();
      store.set(name, value, options);
    },
    clearCookie: async (name) => {
      const store = await cookies();
      store.delete(name);
    },
    redirect,
    // `x-forwarded-proto` can carry a list; the first hop is the one that matters.
    isSecure: async () =>
      ((await headers()).get('x-forwarded-proto') ?? '').split(',')[0]?.trim() === 'https',
  };
}
