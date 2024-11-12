import { useState } from 'react'

import { Wagmi } from './Wagmi'
import { oddworld } from './config'

export function App() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <h2>Vanilla</h2>
      <button
        onClick={() =>
          oddworld.provider.request({ method: 'odyssey_ping' }).then(setResult)
        }
        type="button"
      >
        Ping
      </button>
      <pre>{result}</pre>

      <hr />

      <h2>Wagmi</h2>
      <Wagmi />
    </div>
  )
}
