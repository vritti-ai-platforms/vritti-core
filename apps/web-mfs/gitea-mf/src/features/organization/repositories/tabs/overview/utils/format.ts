const KIB_PER_MIB = 1024;

// The git service reports repository size in KiB. Values are small enough that KiB/MiB covers
// everything, so this stays local rather than reaching for a byte formatter.
export function formatRepositorySize(sizeInKib: number): string {
  if (sizeInKib < KIB_PER_MIB) return `${sizeInKib} KiB`;
  return `${(sizeInKib / KIB_PER_MIB).toFixed(1)} MiB`;
}
