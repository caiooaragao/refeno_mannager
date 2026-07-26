interface FeatureCardProps {
  title: string;
  description: string;
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article
      className="rounded-xl bg-white p-6 shadow-sm"
      style={{ border: "1px solid #d1dce6" }}
    >
      <h2 className="text-lg font-semibold text-blue-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </article>
  );
}
