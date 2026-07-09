import { createContext, type ReactNode, useContext, useMemo, useRef } from 'react';

// Bridges the ScreenHeader's create button (rendered by the navigator) to the list screen's "open create
// sheet" handler (the sheet ref + form live in the screen). Both the header and the screen render inside
// the navigator, which is wrapped by this provider — so the context reaches both. Mirrors UomCreateContext.
interface TaxGroupCreateContextValue {
  requestCreate: () => void;
  setCreateHandler: (fn: (() => void) | null) => void;
}

const TaxGroupCreateContext = createContext<TaxGroupCreateContextValue | null>(null);

export function TaxGroupCreateProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null);
  const value = useMemo<TaxGroupCreateContextValue>(
    () => ({
      requestCreate: () => handlerRef.current?.(),
      setCreateHandler: (fn) => {
        handlerRef.current = fn;
      },
    }),
    [],
  );
  return <TaxGroupCreateContext.Provider value={value}>{children}</TaxGroupCreateContext.Provider>;
}

export function useTaxGroupCreate(): TaxGroupCreateContextValue {
  const ctx = useContext(TaxGroupCreateContext);
  if (!ctx) throw new Error('useTaxGroupCreate must be used within TaxGroupCreateProvider');
  return ctx;
}
