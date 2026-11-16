import Link from "next/link";

export default function LegalPage({ title, children }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 sm:py-16">
      <Link href="/landing" className="text-sm font-medium text-primary hover:underline">Volver a Atlas Ops</Link>
      <h1 className="mb-8 mt-5 text-3xl font-bold sm:text-4xl">{title}</h1>
      <div className="space-y-6 leading-relaxed [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold">
        {children}
      </div>
      <nav aria-label="Información legal" className="mt-10 flex flex-wrap gap-4 border-t border-divider pt-5 text-sm">
        <Link href="/terminos" className="hover:underline">Términos de uso</Link>
        <Link href="/privacidad" className="hover:underline">Política de privacidad</Link>
        <a href="mailto:soporte@atlasops.com.ar" className="hover:underline">Contactar a soporte</a>
      </nav>
    </main>
  );
}
