const BYTES_PER_KIB = 1024;

// Directory entries report size in bytes, unlike the repository total which is already in KiB
export function formatEntrySize(sizeInBytes: number): string {
  if (sizeInBytes < BYTES_PER_KIB) return `${sizeInBytes} B`;
  if (sizeInBytes < BYTES_PER_KIB * BYTES_PER_KIB) return `${Math.round(sizeInBytes / BYTES_PER_KIB)} KiB`;
  return `${(sizeInBytes / (BYTES_PER_KIB * BYTES_PER_KIB)).toFixed(1)} MiB`;
}

// Splits a repository-relative path into cumulative crumbs, e.g. 'src/app/main.ts' becomes
// [{ name: 'src', path: 'src' }, { name: 'app', path: 'src/app' }, { name: 'main.ts', path: 'src/app/main.ts' }]
export function toPathCrumbs(path: string): { name: string; path: string }[] {
  if (!path) return [];

  const segments = path.split('/').filter(Boolean);
  return segments.map((name, index) => ({ name, path: segments.slice(0, index + 1).join('/') }));
}

// Returns the parent directory of a path, or '' when already at the repository root
export function parentPath(path: string): string {
  const index = path.lastIndexOf('/');
  return index === -1 ? '' : path.slice(0, index);
}
