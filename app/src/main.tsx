import { Events } from 'porto/remote'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App.js'
import * as Dialog from './lib/Dialog.ts'
import { porto } from './lib/Porto.ts'
import * as Router from './lib/Router.ts'
import './index.css'

const offInitialized = Events.onInitialized(porto, (payload) => {
  const { mode, referrer } = payload
  Dialog.store.setState({
    mode,
    referrer: {
      ...referrer,
      origin: new URL(referrer.origin),
    },
  })
})

const offRequests = Events.onRequests(porto, (requests) => {
  const request = requests[0]?.request
  Router.router.navigate({
    to: '/dialog/' + (request?.method ?? ''),
    search: request?.params as never,
  })
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
