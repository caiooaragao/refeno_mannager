"use client";

import { PoliticaDePrivacidadeContent } from "@/components/politica-de-privacidade/PoliticaDePrivacidade";

interface PoliticaDePrivacidadeModalProps {
  onClose: () => void;
}

export function PoliticaDePrivacidadeModal({
  onClose,
}: PoliticaDePrivacidadeModalProps) {
  return (
    <div
      className="forest-modal-overlay py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-policy-title"
    >
      <div className="forest-modal max-h-[90vh] max-w-2xl overflow-y-auto">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="forest-chip mb-2">REFENO 2026</p>
            <h2
              id="privacy-policy-title"
              className="forest-form-title text-xl sm:text-2xl"
            >
              Política de Privacidade
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="cursor-pointer rounded px-2 py-1 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
          >
            ✕
          </button>
        </div>

        <PoliticaDePrivacidadeContent />
      </div>
    </div>
  );
}
