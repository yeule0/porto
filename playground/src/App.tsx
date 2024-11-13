import { useEffect, useState } from 'react'
import { type Hex, encodeFunctionData } from 'viem'

import { parseEther } from 'viem/utils'
import { Wagmi } from './Wagmi'
import { oddworld } from './config'
import { ExperimentERC20 } from './contracts'

export function App() {
  return (
    <div>
      <h2>Vanilla</h2>
      <Events />
      <Ping />
      <Register />
      <Login />
      <SendTransaction />
      <SendCalls />

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
      <h3>oddworld_ping</h3>
      <button
        onClick={() =>
          oddworld.provider.request({ method: 'oddworld_ping' }).then(setResult)
        }
        type="button"
      >
        Ping
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function Register() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <h3>experimental_registerAccount</h3>
      <button
        onClick={() =>
          oddworld.provider
            .request({ method: 'experimental_registerAccount' })
            .then(setResult)
        }
        type="button"
      >
        Register
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function Login() {
  const [result, setResult] = useState<readonly string[] | null>(null)
  return (
    <div>
      <h3>eth_requestAccounts</h3>
      <button
        onClick={() =>
          oddworld.provider
            .request({ method: 'eth_requestAccounts' })
            .then(setResult)
        }
        type="button"
      >
        Login
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function SendTransaction() {
  const [result, setResult] = useState<Hex | null>(null)
  return (
    <div>
      <h3>eth_sendTransaction</h3>
      <button
        onClick={async () => {
          const [account] = await oddworld.provider.request({
            method: 'eth_accounts',
          })
          await oddworld.provider
            .request({
              method: 'eth_sendTransaction',
              params: [
                {
                  from: account,
                  to: ExperimentERC20.address,
                  data: encodeFunctionData({
                    abi: ExperimentERC20.abi,
                    functionName: 'mint',
                    args: [account, parseEther('100')],
                  }),
                },
              ],
            })
            .then(setResult)
        }}
        type="button"
      >
        Mint 100 EXP
      </button>
      <pre>{result}</pre>
    </div>
  )
}

function SendCalls() {
  const [result, setResult] = useState<string | null>(null)
  return (
    <div>
      <h3>wallet_sendCalls</h3>
      <button
        onClick={async () => {
          const [account] = await oddworld.provider.request({
            method: 'eth_accounts',
          })
          const hash = await oddworld.provider.request({
            method: 'wallet_sendCalls',
            params: [
              {
                calls: [
                  {
                    to: ExperimentERC20.address,
                    data: encodeFunctionData({
                      abi: ExperimentERC20.abi,
                      functionName: 'approve',
                      args: [account, parseEther('50')],
                    }),
                  },
                  {
                    to: ExperimentERC20.address,
                    data: encodeFunctionData({
                      abi: ExperimentERC20.abi,
                      functionName: 'transferFrom',
                      args: [
                        account,
                        '0x0000000000000000000000000000000000000000',
                        parseEther('50'),
                      ],
                    }),
                  },
                ],
                from: account,
                version: '1',
              },
            ],
          })
          setResult(hash)
        }}
        type="button"
      >
        Approve + Transfer 50 EXP
      </button>
      <pre>{result}</pre>
    </div>
  )
}
