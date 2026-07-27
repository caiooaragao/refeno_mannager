"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface ConfirmState {
  message: string;
  resolve: (confirmed: boolean) => void;
}

const ConfirmContext = createContext<
  ((message: string) => Promise<boolean>) | null
>(null);

interface ConfirmProviderProps {
  children: ReactNode;
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  function handleClose(confirmed: boolean) {
    confirmState?.resolve(confirmed);
    setConfirmState(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {confirmState && (
        <div
          className="forest-modal-overlay z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
        >
          <div className="forest-modal max-w-sm">
            <h2
              id="confirm-dialog-title"
              className="text-headline-sm text-on-surface"
            >
              Confirmar ação
            </h2>

            <p className="mt-3 text-body-sm leading-relaxed text-on-surface-variant">
              {confirmState.message}
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="forest-btn-secondary px-4 py-2"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleClose(true)}
                className="forest-btn-primary px-4 py-2"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);

  if (!confirm) {
    throw new Error("useConfirm deve ser usado dentro de ConfirmProvider");
  }

  return confirm;
}
