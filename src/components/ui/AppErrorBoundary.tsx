import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  error: Error | null
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The application encountered a rendering error.', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
          <section
            role="alert"
            className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-lg dark:border-red-900 dark:bg-slate-900"
          >
            <h1 className="text-xl font-bold">This page ran into a problem</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {this.state.error.message ||
                'An unexpected error occurred while rendering the page.'}
            </p>
            <button
              type="button"
              className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
