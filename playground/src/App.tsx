import { useEffect, useState } from 'react'

import { Wagmi } from './Wagmi'
import { oddworld } from './config'

export function App() {
  return (
    <div>
      <h2>Vanilla</h2>
      <Events />
      <Ping />
      <Register />
      <Login />

      <hr />

      <h2>Wagmi</h2>
      <Wagmi />
    </div>
  )
}

function Events() {
  const [responses, setResponses] = useState<Record<string, unknown>>({})
  useEffect(() => {
    const handleResponse = (event: string) => (response: unknown) =>
      setResponses((responses) => ({
        ...responses,
        [event]: response,
      }))

    const handleAccountsChanged = handleResponse('accountsChanged')
    const handleChainChanged = handleResponse('chainChanged')
    const handleConnect = handleResponse('connect')
    const handleDisconnect = handleResponse('disconnect')
    const handleMessage = handleResponse('message')

    oddworld.provider.on('accountsChanged', handleAccountsChanged)
    oddworld.provider.on('chainChanged', handleChainChanged)
    oddworld.provider.on('connect', handleConnect)
    oddworld.provider.on('disconnect', handleDisconnect)
    oddworld.provider.on('message', handleMessage)
    return () => {
      oddworld.provider.removeListener('accountsChanged', handleAccountsChanged)
      oddworld.provider.removeListener('chainChanged', handleChainChanged)
      oddworld.provider.removeListener('connect', handleConnect)
      oddworld.provider.removeListener('disconnect', handleDisconnect)
      oddworld.provider.removeListener('message', handleMessage)
    }
  }, [])
  return (
    <div>
      <h3>Events</h3>
      <pre>{JSON.stringify(responses, null, 2)}</pre>
    </div>
  )
}

function Ping() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <h3>Ping Provider</h3>
      <button
        onClick={() =>
          oddworld.provider.request({ method: 'odyssey_ping' }).then(setResult)
        }
        type="button"
      >
        odyssey_ping
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function Register() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <h3>Register</h3>
      <button
        onClick={() =>
          oddworld.provider
            .request({ method: 'odyssey_registerAccount' })
            .then(setResult)
        }
        type="button"
      >
        odyssey_registerAccount
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function Login() {
  const [result, setResult] = useState<readonly string[] | null>(null)
  return (
    <div>
      <h3>Login</h3>
      <button
        onClick={() =>
          oddworld.provider
            .request({ method: 'eth_requestAccounts' })
            .then(setResult)
        }
        type="button"
      >
        eth_requestAccounts
      </button>
      <pre>{result}</pre>
    </div>
  )
}
