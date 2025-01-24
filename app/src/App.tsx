import { RouterProvider } from '@tanstack/react-router'
import { Hooks } from 'porto/remote'
import { useAppStore } from './lib/app.ts'
import { porto } from './lib/porto.ts'
import { router } from './lib/router.ts'

export function App() {
  const appState = useAppStore()
  const portoState = Hooks.usePortoStore(porto)
  return <RouterProvider router={router} context={{ appState, portoState }} />
}
