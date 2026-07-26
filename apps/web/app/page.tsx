import { Hero } from "@/components/home/Hero";
import { FeatureGrid } from "@/components/home/FeatureGrid";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10" style={{ maxWidth: "64rem" }}>
      <Hero />
      <FeatureGrid />
    </div>
  );
}
