import Link from "next/link";

export function Hero() {
  return (
    <section
      className="rounded-2xl bg-white px-8 py-12 text-center shadow-sm"
      style={{ border: "1px solid #d1dce6" }}
    >
      <h1 className="text-3xl font-bold text-blue-900 md:text-4xl">
        Gestão de Inspeções de Embarcações
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-slate-600">
        Cadastre inspeções de forma simples e organize os horários de cada
        embarcação com o Refeno Manager.
      </p>
      <Link
        href="/forms/refeno"
        className="mt-8 inline-block rounded-lg px-6 py-3 font-semibold text-white"
        style={{ backgroundColor: "#1e5a8a" }}
      >
        Acessar formulário
      </Link>
    </section>
  );
}
