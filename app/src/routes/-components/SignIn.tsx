import { useMutation } from '@tanstack/react-query'
import { Actions, Hooks } from 'porto/remote'

import LucideLogIn from '~icons/lucide/log-in'
import { Button } from '../../components/Button'
import { Layout } from '../../components/Layout'
import { useAppStore } from '../../lib/app'
import { porto } from '../../lib/porto'
import { StringFormatter } from '../../utils'

export function SignIn(props: Authenticate.Props) {
  const { address } = props

  const hostname = useAppStore((state) => state.referrer?.origin.hostname)

  const request = Hooks.useRequest(porto)
  const respond = useMutation({
    mutationFn() {
      return Actions.respond(porto, request!)
    },
  })

  return (
    <Layout loading={respond.isPending} loadingTitle="Signing in">
      <Layout.Header
        title="Sign in"
        icon={LucideLogIn}
        content={
          <>
            Authenticate with your passkey wallet to start using{' '}
            <span className="font-medium">{hostname}</span>.
          </>
        }
      />

      <Layout.Footer className="space-y-3">
        <div className="flex gap-2 px-3">
          <Button type="button" onClick={() => Actions.reject(porto, request!)}>
            No thanks
          </Button>

          <Button
            className="flex-grow"
            type="button"
            variant="primary"
            onClick={() => respond.mutate()}
          >
            Sign in
          </Button>
        </div>

        {address && (
          <div className="flex justify-between border-blackA1 border-t px-3 pt-3 dark:border-whiteA1">
            <div className="text-[13px] text-gray9 leading-[22px]">Wallet</div>

            <div className="flex items-center gap-1.5">
              <div className="font-medium text-[14px] text-gray12">
                {StringFormatter.truncate(address, { start: 6, end: 4 })}
              </div>
            </div>
          </div>
        )}
      </Layout.Footer>
    </Layout>
  )
}

export declare namespace Authenticate {
  type Props = {
    address?: string
  }
}
