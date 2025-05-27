import { useEffect, useState } from 'react';

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun';
const STORAGE_KEY = 'packageManager';
const DEFAULT_PM: PackageManager = 'npm';

export function usePackageManager(): readonly [
  PackageManager,
  (pm: PackageManager) => void,
] {
  // lazy‐init from localStorage (or default)
  const [pm, setPm] = useState<PackageManager>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'npm' ||
        stored === 'yarn' ||
        stored === 'pnpm' ||
        stored === 'bun'
        ? stored
        : DEFAULT_PM;
    } catch {
      return DEFAULT_PM;
    }
  });

  // sync out to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, pm);
    } catch {
      // ignore (e.g. quota error, private mode)
    }
  }, [pm]);

  return [pm, setPm] as const;
}
