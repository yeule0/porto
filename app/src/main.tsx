import { Events } from 'porto/remote'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App.js'
import { appStore } from './lib/app.ts'
import { porto } from './lib/porto.ts'
import { router } from './lib/router.ts'
import './index.css'

const offInitialized = Events.onInitialized(porto, (payload) => {
  const { mode, referrer } = payload
  appStore.setState({
    mode,
    referrer: new URL(referrer),
  })
})

const offRequests = Events.onRequests(porto, (requests) => {
  const request = requests[0]?.request
  const search: Parameters<(typeof router)['navigate']>[0]['search'] = (prev) =>
    prev as never

  if (request?.method === 'wallet_connect') {
    const capabilities = request.params?.[0]?.capabilities ?? {}
    if (capabilities.createAccount) router.navigate({ to: '/register', search })
    else router.navigate({ to: '/login', search })
  } else {
    router.navigate({ to: '/', search })
  }
})

porto.ready()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.hot)
  import.meta.hot.on('vite:beforeUpdate', () => {
    offInitialized()
    offRequests()
  })

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}
