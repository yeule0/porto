import { W } from 'porto/wagmi'
import { formatEther, parseEther } from 'viem'
import { type BaseError, useAccount, useConnect, useReadContract } from 'wagmi'
import { useCallsStatus, useSendCalls } from 'wagmi/experimental'

import { ExperimentERC20 } from './contracts'

export function App() {
  const { isConnected } = useAccount()
  return (
    <>
      <Account />
      <Connect />
      {isConnected && (
        <>
          <Balance />
          <GrantSession />
          <Mint />
        </>
      )}
    </>
  )
}

function Account() {
  const account = useAccount()
  const { data: sessions } = W.useSessions()
  const disconnect = W.useDisconnect()

  return (
    <div>
      <h2>Account</h2>

      <div>
        account: {account.address}
        <br />
        chainId: {account.chainId}
        <br />
        status: {account.status}
        <br />
        sessions: {JSON.stringify(sessions)}
      </div>

      {account.status !== 'disconnected' && (
        <button type="button" onClick={() => disconnect.mutate({})}>
          Log Out
        </button>
      )}
    </div>
  )
}

function Connect() {
  const connect = useConnect()
  const createAccount = W.useCreateAccount()

  return (
    <div>
      <h2>Connect</h2>
      {connect.connectors
        .filter((x) => x.id === 'xyz.ithaca.porto')
        ?.map((connector) => (
          <div key={connector.uid}>
            <button
              key={connector.uid}
              onClick={() => connect.connect({ connector })}
              type="button"
            >
              Login
            </button>
            <button
              onClick={() => createAccount.mutate({ connector })}
              type="button"
            >
              Register
            </button>
          </div>
        ))}
      <div>{connect.status ?? createAccount.status}</div>
      <div>{connect.error?.message ?? createAccount.error?.message}</div>
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

function GrantSession() {
  const grantSession = W.useGrantSession()

  return (
    <div>
      <h2>Grant Session</h2>
      <button onClick={() => grantSession.mutate({})} type="button">
        Grant Session
      </button>
      {grantSession.data && <div>Session granted.</div>}
      {grantSession.error && (
        <div>
          Error: {grantSession.error.shortMessage || grantSession.error.message}
        </div>
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
          sendCalls({
            calls: [
              {
                abi: ExperimentERC20.abi,
                to: ExperimentERC20.address,
                functionName: 'mint',
                args: [address!, parseEther('100')],
              },
            ],
          })
        }}
      >
        <button disabled={isPending} type="submit">
          {isPending ? 'Confirming...' : 'Mint 100 EXP'}
        </button>
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
