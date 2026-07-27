function formatTime(datetime: string): string {
  const timePart = datetime.split(" ")[1];
  return timePart ? timePart.slice(0, 5) : datetime;
}

interface InspectionSuccessProps {
  nomeEmbarcacao: string;
  horarioInicio: string;
  horarioFim: string;
  onNewInspection: () => void;
}

export function InspectionSuccess({
  nomeEmbarcacao,
  horarioInicio,
  horarioFim,
  onNewInspection,
}: InspectionSuccessProps) {
  const inicio = formatTime(horarioInicio);
  const fim = formatTime(horarioFim);

  return (
    <div className="animate-fade-in-up flex flex-col items-center py-4 text-center sm:py-6">
      <div className="forest-success-icon mb-5">
        <svg
          className="h-8 w-8 text-primary sm:h-10 sm:w-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>

      <h2 className="text-headline-sm text-on-surface sm:text-headline-md">
        Cadastro realizado!
      </h2>

      <p className="mt-4 max-w-md text-body-sm leading-relaxed text-on-primary-container sm:text-body-md">
        Inspeção do barco{" "}
        <span className="font-semibold">{nomeEmbarcacao}</span> cadastrada com
        sucesso para os horários{" "}
        <span className="font-semibold">{inicio}</span> até{" "}
        <span className="font-semibold">{fim}</span>!
      </p>

      <button
        type="button"
        onClick={onNewInspection}
        className="forest-btn-primary mt-8 text-base"
      >
        Cadastrar nova inspeção
      </button>
    </div>
  );
}
