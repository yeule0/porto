import { Client } from 'oddworld'
import { useState } from 'react'

const client = Client.create()

export function App() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <button
        onClick={() =>
          client.provider.request({ method: 'ping' }).then(setResult)
        }
        type="button"
      >
        Ping
      </button>
      <pre>{result}</pre>
    </div>
  )
}
