import Link from 'next/link';
// Inconsequential comment to trigger a push


export default function HomePage(): React.ReactElement {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="space-y-6 text-center">
        <h1 className="text-4xl font-semibold text-slate-900">Solicitar nuevo proyecto de desarrollo</h1>
        <p className="text-lg text-slate-600">
          Completá el formulario para solicitar un nuevo proyecto de desarrollo. Tu requerimiento será evaluado y
          priorizado.
        </p>
      </div>

      <div className="mt-14 flex justify-center">
        <Link
          href="/projects/new"
          className="group rounded-xl border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg md:max-w-md"
        >
          <h2 className="text-xl font-semibold text-slate-900 group-hover:text-blue-600">
            Solicitar nuevo proyecto de desarrollo
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Completá el formulario para solicitar un nuevo proyecto de desarrollo. Tu requerimiento será evaluado y
            priorizado.
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-medium text-blue-600">
            Ingresar
            <svg
              className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </Link>
      </div>
    </main>
  );
}

