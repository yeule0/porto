import { useEffect } from 'react'
import { useChainId, useConnect } from 'wagmi'
import { oddworld } from './config'

export function Wagmi() {
  useEffect(() => oddworld.announceProvider(), [])
  return (
    <>
      <Connect />
    </>
  )
}

function Connect() {
  const chainId = useChainId()
  const { connectors, connect, status, error } = useConnect()

  return (
    <div>
      <h3>Connect (EIP-6963)</h3>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector, chainId })}
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <img
              src={connector.icon}
              alt={connector.name}
              width={24}
              height={24}
            />
            {connector.name}
          </button>
        ))}
      </div>
      <div>{status}</div>
      <div>{error?.message}</div>
    </div>
  )
}
