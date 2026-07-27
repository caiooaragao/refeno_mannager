import Link from "next/link";

export function Hero() {
  return (
    <section className="forest-card px-8 py-12 text-center md:px-16 md:py-16">
      <h1 className="text-display-lg text-on-surface">
        Gestão de Inspeções de Embarcações
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-body-lg text-on-surface-variant">
        Cadastre inspeções de forma simples e organize os horários de cada
        embarcação com o Refeno Manager.
      </p>
      <Link href="/forms/refeno" className="forest-btn-primary mt-8 inline-block">
        Acessar formulário
      </Link>
    </section>
  );
}
