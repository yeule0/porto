import { Porto } from '@porto/apps'
import { Button, Spinner } from '@porto/apps/components'
import { useQuery } from '@tanstack/react-query'
import { cx } from 'cva'
import type { RpcSchema } from 'ox'
import { Delegation } from 'porto'
import { Hooks } from 'porto/remote'
import * as React from 'react'

import * as Dialog from '~/lib/Dialog'
import { Layout } from '~/routes/-components/Layout'
import { ValueFormatter } from '~/utils'
import ArrowDownLeft from '~icons/lucide/arrow-down-left'
import ArrowUpRight from '~icons/lucide/arrow-up-right'
import TriangleAlert from '~icons/lucide/triangle-alert'
import Star from '~icons/ph/star-four-bold'

const porto = Porto.porto

export function ActionRequest(props: ActionRequest.Props) {
  const { calls, loading, onApprove, onReject } = props

  const account = Hooks.useAccount(porto)
  const client = Hooks.useClient(porto)
  const origin = Dialog.useStore((state) => state.referrer?.origin)

  const chainId =
    typeof props.chainId === 'number'
      ? props.chainId
      : Hooks.useChain(porto)?.id
  const chain = React.useMemo(() => {
    return porto._internal.config.chains.find((x) => x.id === chainId)
  }, [chainId])

  const simulate = useQuery({
    queryFn: async () => {
      const { balances, results } = await Delegation.simulate(client, {
        account: account!.address!,
        calls: calls as any,
      })
      const failure = results.find((x) => x.status === 'failure')
      if (failure) throw failure.error
      return { balances, results }
    },
    queryKey: ['simulate', client.uid, calls],
  })
  const balances =
    simulate.data?.balances.filter((x) => x.value.diff !== 0n) ?? []

  return (
    <Layout loading={loading} loadingTitle="Sending...">
      <Layout.Header>
        <Layout.Header.Default
          content={<>Review the action to perform below.</>}
          icon={simulate.status === 'error' ? TriangleAlert : Star}
          title="Action Request"
          variant={simulate.status === 'error' ? 'warning' : 'default'}
        />
      </Layout.Header>

      <Layout.Content>
        <div className="space-y-3">
          {simulate.isPending && (
            <div className="space-y-2 rounded-lg bg-surface p-3">
              <div className="flex size-[24px] w-full items-center justify-center">
                <Spinner className="text-secondary" />
              </div>
            </div>
          )}

          {simulate.isError && (
            <div className="rounded-lg bg-warningTint px-3 py-2 text-warning">
              <div className="font-medium text-[14px]">Error</div>
              <div className="space-y-2 text-[14px] text-primary">
                <p>
                  An error occurred while simulating the action. Proceed with
                  caution.
                </p>
                <p>
                  Contact{' '}
                  <span className="font-medium">{origin?.hostname}</span> for
                  more information.
                </p>
              </div>
            </div>
          )}

          {(simulate.isSuccess || simulate.isError) && (
            <div className="space-y-3 rounded-lg bg-surface p-3">
              {balances.length > 0 && (
                <>
                  <div className="space-y-2">
                    {balances.map((balance) => {
                      const { token, value } = balance
                      if (value.diff === BigInt(0)) return null

                      const { decimals, symbol } = token

                      const receiving = value.diff > BigInt(0)
                      const formatted = ValueFormatter.format(
                        value.diff,
                        decimals,
                      )

                      const Icon = receiving ? ArrowDownLeft : ArrowUpRight

                      return (
                        <div
                          className="flex gap-2 font-medium"
                          key={token.address}
                        >
                          <div
                            className={cx(
                              'flex size-[24px] items-center justify-center rounded-full',
                              {
                                'bg-destructiveTint': !receiving,
                                'bg-successTint': receiving,
                              },
                            )}
                          >
                            <Icon
                              className={cx('size-4 text-current', {
                                'text-destructive': !receiving,
                                'text-success': receiving,
                              })}
                            />
                          </div>
                          <div>
                            {receiving ? 'Receive' : 'Send'}{' '}
                            <span
                              className={
                                receiving ? 'text-success' : 'text-destructive'
                              }
                            >
                              {formatted}
                            </span>{' '}
                            {symbol}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="h-[1px] w-full bg-gray6" />
                </>
              )}

              <div className="space-y-1">
                {/* TODO: Fees */}
                <div className="flex justify-between text-[14px]">
                  <span className="text-[14px] text-secondary">
                    Fees (est.)
                  </span>
                  <span className="font-medium">$0.01</span>
                </div>

                <div className="flex justify-between text-[14px]">
                  <span className="text-[14px] text-secondary">
                    Duration (est.)
                  </span>
                  <span className="font-medium">2 seconds</span>
                </div>

                {chain?.name && (
                  <div className="flex justify-between text-[14px]">
                    <span className="text-[14px] text-secondary">Network</span>
                    <span className="font-medium">{chain?.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Layout.Content>

      <Layout.Footer>
        {simulate.isSuccess && (
          <Layout.Footer.Actions>
            <Button
              className="flex-grow"
              onClick={onReject}
              type="button"
              variant="destructive"
            >
              Deny
            </Button>

            <Button
              className="flex-grow"
              onClick={onApprove}
              type="button"
              variant="success"
            >
              Approve
            </Button>
          </Layout.Footer.Actions>
        )}

        {simulate.isError && (
          <Layout.Footer.Actions>
            <Button
              className="flex-grow"
              onClick={onReject}
              type="button"
              variant="destructive"
            >
              Deny
            </Button>
            <Button
              className="flex-grow"
              onClick={onApprove}
              type="button"
              variant="default"
            >
              Approve anyway
            </Button>
          </Layout.Footer.Actions>
        )}
        <Layout.Footer.Account />
      </Layout.Footer>
    </Layout>
  )
}

export namespace ActionRequest {
  export type Props = {
    calls: RpcSchema.ExtractParams<
      RpcSchema.Wallet,
      'wallet_sendCalls'
    >[0]['calls']
    chainId?: number | undefined
    loading?: boolean | undefined
    onApprove: () => void
    onReject: () => void
  }
}
