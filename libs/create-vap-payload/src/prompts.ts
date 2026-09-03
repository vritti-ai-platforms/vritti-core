import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';

/**
 * The question layer, on `node:readline/promises` rather than a prompt library.
 *
 * This package is fetched and executed on every `pnpm create`, so its install
 * time is felt by whoever runs it. A dependency-free CLI downloads in one
 * request; the same thing with a prompt framework pulls a tree of them for
 * three questions and a text field.
 */
export interface Asker {
  text(question: string, options?: { default?: string; validate?: (value: string) => string | null }): Promise<string>;
  confirm(question: string, fallback: boolean): Promise<boolean>;
  close(): void;
}

/** Reads answers from the terminal. */
export function interactiveAsker(): Asker {
  const rl = createInterface({ input: stdin, output: stdout });

  return {
    async text(question, options = {}) {
      for (;;) {
        const suffix = options.default ? ` (${options.default})` : '';
        const answer = (await rl.question(`${question}${suffix}: `)).trim() || options.default || '';
        const problem = options.validate?.(answer);
        if (!problem) return answer;
        stdout.write(`  ${problem}\n`);
      }
    },
    async confirm(question, fallback) {
      const hint = fallback ? 'Y/n' : 'y/N';
      for (;;) {
        const answer = (await rl.question(`${question} (${hint}): `)).trim().toLowerCase();
        if (!answer) return fallback;
        if (answer === 'y' || answer === 'yes') return true;
        if (answer === 'n' || answer === 'no') return false;
        stdout.write('  Answer y or n.\n');
      }
    },
    close() {
      rl.close();
    },
  };
}

/**
 * Answers every question from its default, for `--yes` and for CI.
 *
 * A generator that cannot run unattended is one nothing can test, so this is
 * not a convenience — the scaffold-and-build job in CI drives the CLI through
 * this path for every feature combination.
 */
export function defaultingAsker(): Asker {
  return {
    async text(question, options = {}) {
      const answer = options.default ?? '';
      const problem = options.validate?.(answer);
      if (problem) throw new Error(`--yes was given but ${question} has no usable default: ${problem}`);
      return answer;
    },
    async confirm(_question, fallback) {
      return fallback;
    },
    close() {},
  };
}
