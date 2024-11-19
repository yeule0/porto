import { formatEther, parseEther } from 'viem'
import { type BaseError, useAccount, useConnect, useReadContract } from 'wagmi'
import { useCallsStatus, useSendCalls } from 'wagmi/experimental'
import { ExperimentERC20 } from './contracts'
import { useCreateAccount, useCreateSessionKey, useDisconnect } from './hooks'

export function App() {
  const { isConnected } = useAccount()
  return (
    <>
      <Account />
      <Connect />
      {isConnected && (
        <>
          <Balance />
          <CreateSessionKey />
          <Mint />
        </>
      )}
    </>
  )
}

function Account() {
  const account = useAccount()
  const { mutate: disconnect } = useDisconnect()

  return (
    <div>
      <h2>Account</h2>

      <div>
        account: {account.address}
        <br />
        chainId: {account.chainId}
        <br />
        status: {account.status}
      </div>

      {account.status !== 'disconnected' && (
        <button type="button" onClick={() => disconnect()}>
          Log Out
        </button>
      )}
    </div>
  )
}

function Connect() {
  const { connectors, connect, status, error } = useConnect()
  const { mutate: createAccount } = useCreateAccount()

  return (
    <div>
      <h2>Connect</h2>
      {connectors
        .filter((x) => x.id === 'xyz.ithaca.oddworld')
        ?.map((connector) => (
          <div key={connector.uid}>
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              type="button"
            >
              Login
            </button>
            <button onClick={() => createAccount({ connector })} type="button">
              Register
            </button>
          </div>
        ))}
      <div>{status}</div>
      <div>{error?.message}</div>
    </div>
  )
}

function Balance() {
  const { address } = useAccount()
  const { data: balance } = useReadContract({
    ...ExperimentERC20,
    query: {
      enabled: !!address,
      refetchInterval: 2_000,
    },
    functionName: 'balanceOf',
    args: [address!],
  })

  return (
    <div>
      <h2>Balance</h2>
      <div>Balance: {formatEther(balance ?? 0n)} EXP</div>
    </div>
  )
}

function CreateSessionKey() {
  const { data, error, mutate: createSessionKey } = useCreateSessionKey()

  return (
    <div>
      <h2>Create Session Key</h2>
      <button onClick={() => createSessionKey()} type="button">
        Create Session Key
      </button>
      {data && <div>Session Key created.</div>}
      {error && (
        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
      )}
    </div>
  )
}

function Mint() {
  const { address } = useAccount()
  const { data: id, error, isPending, sendCalls } = useSendCalls()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useCallsStatus({
    id: id as string,
    query: {
      enabled: !!id,
      refetchInterval({ state }) {
        if (state.data?.status === 'CONFIRMED') return false
        return 1_000
      },
    },
  })

  return (
    <div>
      <h2>Mint EXP</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()

          const formData = new FormData(e.target as HTMLFormElement)
          const sessionKeyEnabled = Boolean(formData.get('sessionKeyEnabled'))

          sendCalls({
            calls: [
              {
                abi: ExperimentERC20.abi,
                to: ExperimentERC20.address,
                functionName: 'mint',
                args: [address!, parseEther('100')],
              },
            ],
            capabilities: {
              sessionKey: {
                enabled: sessionKeyEnabled,
              },
            },
          })
        }}
      >
        <button disabled={isPending} type="submit">
          {isPending ? 'Confirming...' : 'Mint 100 EXP'}
        </button>
        <label>
          <input name="sessionKeyEnabled" type="checkbox" />
          Use Session Key
        </label>
      </form>
      {id && <div>Transaction Hash: {id}</div>}
      {isConfirming && 'Waiting for confirmation...'}
      {isConfirmed && 'Transaction confirmed.'}
      {error && (
        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
      )}
    </div>
  )
}
