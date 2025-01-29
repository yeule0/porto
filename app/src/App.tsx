import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { Hooks } from 'porto/remote'
import { useAppStore } from './lib/app.ts'
import { porto } from './lib/porto.ts'
import { router } from './lib/router.ts'

const queryClient = new QueryClient()

export function App() {
  const appState = useAppStore()
  const portoState = Hooks.usePortoStore(porto)
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} context={{ appState, portoState }} />
    </QueryClientProvider>
  )
}
