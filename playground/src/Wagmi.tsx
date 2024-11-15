import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi'

export function Wagmi() {
  return (
    <>
      <Account />
      <Connect />
    </>
  )
}

function Account() {
  const account = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <div>
      <h3>Account</h3>

      <div>
        account: {account.address}
        <br />
        chainId: {account.chainId}
        <br />
        status: {account.status}
      </div>

      {account.status !== 'disconnected' && (
        <button type="button" onClick={() => disconnect()}>
          Disconnect
        </button>
      )}
    </div>
  )
}

function Connect() {
  const chainId = useChainId()
  const { connectors, connect, error } = useConnect()

  return (
    <div>
      <h3>Connect (EIP-6963)</h3>
      <p>Vanilla Wagmi</p>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector, chainId })}
            type="button"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {connector.name}
          </button>
        ))}
      </div>
      <p>RainbowKit</p>
      <ConnectButton />
      <div>{error?.message}</div>
    </div>
  )
}
