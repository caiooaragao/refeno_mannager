import { RefenoForm } from "@/components/forms/RefenoForm";

export default function RefenoFormPage() {
  return (
    <div className="relative w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center  scale-105"
        style={{ backgroundImage: "url('/images/refeno_banner.jpeg')" }}
      />
      <div className="relative mx-auto w-full max-w-xl px-3 py-6 sm:px-4 sm:py-10">
        <RefenoForm />
      </div>
    </div>
  );
}
