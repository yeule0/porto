import { Hex, type RpcSchema } from 'ox'
import type { RpcSchema as porto_RpcSchema } from 'porto'
import { useMemo, useState } from 'react'
import { erc20Abi } from 'viem'
import { useReadContract } from 'wagmi'

import { Button } from '~/components/Button'
import { Layout } from '~/components/Layout'
import { Spinner } from '~/components/Spinner'
import * as Dialog from '~/lib/Dialog'
import { ValueFormatter } from '~/utils'
import LucideKey from '~icons/lucide/key-round'
import { NotFound } from './NotFound'

export function Authorize(props: Authorize.Props) {
  const { address, permissions, role, loading, onApprove, onReject } = props

  const [index, setIndex] = useState(0)

  if (role === 'admin') return <NotFound />
  if (!permissions?.spend) return <NotFound />
  if (permissions.spend.length === 0) return <NotFound />

  return (
    <Layout loading={loading} loadingTitle="Authorizing...">
      <AuthorizeSpendPermission {...permissions.spend[index]!} />

      <Layout.Footer>
        <Layout.Footer.Actions>
          <Button
            className="flex-1"
            type="button"
            variant="destructive"
            onClick={onReject}
          >
            Deny
          </Button>

          <Button
            className="flex-1"
            type="button"
            variant="success"
            onClick={() => {
              if (index < permissions!.spend!.length - 1) setIndex(index + 1)
              else onApprove()
            }}
          >
            Approve
          </Button>
        </Layout.Footer.Actions>

        <Layout.Footer.Wallet address={address} />
      </Layout.Footer>
    </Layout>
  )
}

export declare namespace Authorize {
  type Props = RpcSchema.ExtractParams<
    porto_RpcSchema.Schema,
    'experimental_authorizeKey'
  >['0'] & {
    loading: boolean
    onApprove: () => void
    onReject: () => void
  }
}

export function AuthorizeSpendPermission(
  props: AuthorizeSpendPermission.Props,
) {
  const { limit, period, token } = props

  const hostname = Dialog.useStore((state) => state.referrer?.origin.hostname)

  // TODO: handle errors
  const symbol = useReadContract({
    abi: erc20Abi,
    address: token,
    functionName: 'symbol',
    query: {
      enabled: !!token,
    },
  })
  const decimals = useReadContract({
    abi: erc20Abi,
    address: token,
    functionName: 'decimals',
    query: {
      enabled: !!token,
    },
  })

  const displayAmount = useMemo(() => {
    if (!decimals.data && token) return null
    return ValueFormatter.format(Hex.toBigInt(limit), decimals.data)
  }, [limit, decimals.data, token])

  return (
    <>
      <Layout.Header>
        <Layout.Header.Default
          icon={LucideKey}
          title="Authorize Spending"
          content={
            <div>
              <span className="font-medium">{hostname}</span> would like
              permissions to spend the following amount:
            </div>
          }
        />
      </Layout.Header>
      <Layout.Content>
        <div className="flex h-[40px] items-center justify-center gap-2 rounded-lg bg-gray3 p-2">
          {displayAmount || !token ? (
            <>
              <div className="mt-[2px]">
                <code>
                  {displayAmount} {symbol.data ?? 'ETH'}
                </code>
              </div>
              <div className="opacity-50">per {period}</div>
            </>
          ) : (
            <Spinner className="text-gray10" />
          )}
        </div>
      </Layout.Content>
    </>
  )
}

export declare namespace AuthorizeSpendPermission {
  type Props = NonNullable<
    NonNullable<Authorize.Props['permissions']>['spend']
  >[number]
}
