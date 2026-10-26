interface ComingSoonPageProps {
  title: string
}

export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        This area is planned and will be implemented in the next project phase.
      </p>
    </section>
  )
}
