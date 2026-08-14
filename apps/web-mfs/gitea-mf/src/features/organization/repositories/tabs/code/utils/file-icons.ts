import {
  Database,
  File,
  FileArchive,
  FileCode,
  FileCog,
  FileImage,
  FileJson,
  FileLock,
  FileSymlink,
  FileTerminal,
  FileText,
  Folder,
  GitBranch,
  Package,
  Palette,
  ScrollText,
} from 'lucide-react';
import type { RepositoryEntryType } from '@/schemas/repositories';

export interface FileIcon {
  Icon: typeof File;
  className: string;
}

// Colours are semantic theme tokens only — never brand hex — so icons stay legible in both themes.
// Shape carries most of the signal; colour is a secondary cue.
const MUTED = 'text-muted-foreground';

// Matched on the whole filename, before any extension lookup
const BY_FILENAME: Record<string, FileIcon> = {
  '.gitattributes': { Icon: GitBranch, className: MUTED },
  '.gitignore': { Icon: GitBranch, className: MUTED },
  '.gitmodules': { Icon: GitBranch, className: MUTED },
  dockerfile: { Icon: Package, className: 'text-primary' },
  license: { Icon: ScrollText, className: MUTED },
  'package-lock.json': { Icon: FileLock, className: MUTED },
  'pnpm-lock.yaml': { Icon: FileLock, className: MUTED },
  'yarn.lock': { Icon: FileLock, className: MUTED },
};

const BY_EXTENSION: Record<string, FileIcon> = {
  bash: { Icon: FileTerminal, className: 'text-success' },
  css: { Icon: Palette, className: 'text-accent-foreground' },
  gif: { Icon: FileImage, className: 'text-success' },
  gz: { Icon: FileArchive, className: MUTED },
  ico: { Icon: FileImage, className: 'text-success' },
  jpeg: { Icon: FileImage, className: 'text-success' },
  jpg: { Icon: FileImage, className: 'text-success' },
  js: { Icon: FileCode, className: 'text-warning' },
  json: { Icon: FileJson, className: 'text-warning' },
  jsonc: { Icon: FileJson, className: 'text-warning' },
  jsx: { Icon: FileCode, className: 'text-warning' },
  markdown: { Icon: FileText, className: MUTED },
  md: { Icon: FileText, className: MUTED },
  mjs: { Icon: FileCode, className: 'text-warning' },
  png: { Icon: FileImage, className: 'text-success' },
  scss: { Icon: Palette, className: 'text-accent-foreground' },
  sh: { Icon: FileTerminal, className: 'text-success' },
  sql: { Icon: Database, className: 'text-accent-foreground' },
  svg: { Icon: FileImage, className: 'text-success' },
  toml: { Icon: FileCog, className: MUTED },
  ts: { Icon: FileCode, className: 'text-primary' },
  tsx: { Icon: FileCode, className: 'text-primary' },
  webp: { Icon: FileImage, className: 'text-success' },
  xml: { Icon: FileCode, className: MUTED },
  yaml: { Icon: FileCog, className: MUTED },
  yml: { Icon: FileCog, className: MUTED },
  zip: { Icon: FileArchive, className: MUTED },
  zsh: { Icon: FileTerminal, className: 'text-success' },
};

const DIRECTORY: FileIcon = { Icon: Folder, className: 'text-primary' };
const FALLBACK: FileIcon = { Icon: File, className: MUTED };

// Picks an icon for a listing entry. Resolution order matters: the entry type wins over any name, and
// an exact filename wins over its extension — `package-lock.json` is a lock file, not a JSON file.
export function resolveFileIcon(name: string, entryType: RepositoryEntryType): FileIcon {
  if (entryType === 'dir') return DIRECTORY;
  if (entryType === 'symlink') return { Icon: FileSymlink, className: MUTED };
  if (entryType === 'submodule') return { Icon: Package, className: 'text-primary' };

  const lower = name.toLowerCase();
  const byName = BY_FILENAME[lower];
  if (byName) return byName;

  // A leading dot is part of the name, not an extension separator — `.gitignore` has no extension
  const dotIndex = lower.lastIndexOf('.');
  if (dotIndex <= 0) return FALLBACK;

  // `next.config.ts` resolves as ts, but a bare `*.config.*` with an unmapped tail reads as config
  const extension = lower.slice(dotIndex + 1);
  return BY_EXTENSION[extension] ?? (lower.includes('.config.') ? { Icon: FileCog, className: MUTED } : FALLBACK);
}
