import Link from "next/link";

const paragraphs = [
  "Os dados informados neste formulário são coletados exclusivamente para viabilizar o agendamento das inspeções das embarcações participantes da REFENO.",
  "Serão coletados apenas os dados necessários para que os inspetores da Marinha do Brasil possam entrar em contato com o responsável pela inspeção da embarcação, que poderá ser o comandante ou um terceiro indicado pelo comandante no momento do preenchimento do formulário.",
  "As informações fornecidas serão utilizadas exclusivamente para essa finalidade, não sendo comercializadas, compartilhadas ou utilizadas para qualquer outro propósito, exceto quando necessário para a realização das inspeções ou para o cumprimento de obrigação legal.",
  "Os dados serão armazenados de forma segura e serão excluídos após a conclusão do período de inspeções da REFENO, ressalvadas as hipóteses em que sua manutenção seja exigida por obrigação legal ou regulatória.",
];

const consentText =
  "Ao enviar este formulário, o responsável declara estar ciente e concordar com a utilização dos dados informados exclusivamente para fins de agendamento e realização das inspeções das embarcações participantes da REFENO.";

export function PoliticaDePrivacidadeContent() {
  return (
    <div className="flex flex-col gap-5">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="text-sm leading-relaxed text-on-surface-variant sm:text-base"
        >
          {paragraph}
        </p>
      ))}

      <p
        className="rounded-md border border-primary/30 bg-primary-container/10 p-4 text-sm leading-relaxed text-on-surface sm:p-5 sm:text-base"
      >
        {consentText}
      </p>
    </div>
  );
}

export default function PoliticaDePrivacidade() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-16 md:py-12">
      <div className="forest-card p-6 sm:p-8">
        <header className="mb-8 border-b border-outline-variant/40 pb-6">
          <p className="forest-chip mb-3">REFENO 2026</p>
          <h1 className="forest-form-title text-2xl sm:text-3xl">
            Política de Privacidade
          </h1>
        </header>

        <PoliticaDePrivacidadeContent />

        <footer className="mt-8 border-t border-outline-variant/40 pt-6">
          <Link
            href="/forms/refeno"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:brightness-110"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Voltar ao formulário
          </Link>
        </footer>
      </div>
    </div>
  );
}
