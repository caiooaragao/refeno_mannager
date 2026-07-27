interface FeatureCardProps {
  title: string;
  description: string;
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <article className="forest-card p-6">
      <h2 className="text-headline-sm text-on-surface">{title}</h2>
      <p className="mt-2 text-body-sm text-on-surface-variant">{description}</p>
    </article>
  );
}
