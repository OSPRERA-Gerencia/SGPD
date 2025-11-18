import Link from 'next/link';

const navigation = [
  {
    href: '/projects',
    title: 'Backlog de proyectos',
    description: 'Visualizá y priorizá los proyectos de desarrollo de toda la organización.',
  },
  {
    href: '/projects/new',
    title: 'Crear nuevo proyecto',
    description: 'Cargá un requerimiento con impacto, frecuencia y urgencia para su priorización.',
  },
  {
    href: '/sprints',
    title: 'Gestión de sprints',
    description: 'Planificá la capacidad disponible y asigná puntos a proyectos priorizados.',
  },
];

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="space-y-6 text-center">
        <h1 className="text-4xl font-semibold text-slate-900">Sistema de gestión y priorización de proyectos</h1>
        <p className="text-lg text-slate-600">
          Centralizá la visibilidad del backlog, calibrá los criterios de priorización y planificá sprints con la
          capacidad disponible.
        </p>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
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
        ))}
      </div>
    </main>
  );
}

