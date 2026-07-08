import { createContext, type ReactNode, useContext, useMemo, useRef } from 'react';

// Bridges the ScreenHeader's create button (rendered by the navigator) to the list screen's "open create
// sheet" handler (the sheet ref + form live in the screen). Both the header and the screen render inside
// the navigator, which is wrapped by this provider — so the context reaches both.
interface UomCreateContextValue {
  // Called by the header's create button.
  requestCreate: () => void;
  // The list screen registers its open-create-sheet handler here (null on unmount).
  setCreateHandler: (fn: (() => void) | null) => void;
}

const UomCreateContext = createContext<UomCreateContextValue | null>(null);

export function UomCreateProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<(() => void) | null>(null);
  const value = useMemo<UomCreateContextValue>(
    () => ({
      requestCreate: () => handlerRef.current?.(),
      setCreateHandler: (fn) => {
        handlerRef.current = fn;
      },
    }),
    [],
  );
  return <UomCreateContext.Provider value={value}>{children}</UomCreateContext.Provider>;
}

export function useUomCreate(): UomCreateContextValue {
  const ctx = useContext(UomCreateContext);
  if (!ctx) throw new Error('useUomCreate must be used within UomCreateProvider');
  return ctx;
}
