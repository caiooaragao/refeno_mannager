import { FeatureCard } from "./FeatureCard";

const features = [
  {
    title: "Cadastro rápido",
    description:
      "Preencha nome, embarcação, responsável e horários em poucos passos.",
  },
  {
    title: "Validação automática",
    description:
      "O sistema garante que todos os campos estejam corretos antes do envio.",
  },
  {
    title: "Área administrativa",
    description:
      "Acesse o painel admin para gerenciar o sistema com login seguro.",
  },
];

export function FeatureGrid() {
  return (
    <section className="mt-10 grid gap-6 md:grid-cols-3">
      {features.map((feature) => (
        <FeatureCard
          key={feature.title}
          title={feature.title}
          description={feature.description}
        />
      ))}
    </section>
  );
}
