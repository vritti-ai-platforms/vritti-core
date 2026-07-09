import { createContext, type ReactNode, useContext, useMemo, useRef } from 'react';

// Bridges the ScreenHeader's create button (rendered by the navigator) to the list screen's "open create
// sheet" handler. Both render inside the navigator, which is wrapped by this provider. Mirrors
// TaxGroupCreateContext / UomCreateContext.
interface CostCategoryCreateContextValue {
  requestCreate: () => void;
  setCreateHandler: (fn: (() => void) | null) => void;
}

const CostCategoryCreateContext = createContext<CostCategoryCreateContextValue | null>(null);

export function CostCategoryCreateProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null);
  const value = useMemo<CostCategoryCreateContextValue>(
    () => ({
      requestCreate: () => handlerRef.current?.(),
      setCreateHandler: (fn) => {
        handlerRef.current = fn;
      },
    }),
    [],
  );
  return <CostCategoryCreateContext.Provider value={value}>{children}</CostCategoryCreateContext.Provider>;
}

export function useCostCategoryCreate(): CostCategoryCreateContextValue {
  const ctx = useContext(CostCategoryCreateContext);
  if (!ctx) throw new Error('useCostCategoryCreate must be used within CostCategoryCreateProvider');
  return ctx;
}
