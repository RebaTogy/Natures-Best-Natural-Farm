import BlurBackground from "@/components/ui/BlurBackground";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <BlurBackground className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-farm-cream-50 p-8 border border-farm-green-900/5">
        <span className="text-2xs uppercase tracking-widest font-semibold text-farm-gold-600">Policy</span>
        <h1 className="mt-1 font-serif text-4xl font-bold text-farm-green-950">{title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-farm-green-800">{children}</div>
      </div>
    </BlurBackground>
  );
}
