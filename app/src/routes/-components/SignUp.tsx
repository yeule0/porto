import { useMutation } from '@tanstack/react-query'
import { Actions, Hooks } from 'porto/remote'

import LucideLogIn from '~icons/lucide/log-in'
import { Button } from '../../components/Button'
import { Layout } from '../../components/Layout'
import { useAppStore } from '../../lib/app'
import { porto } from '../../lib/porto'

export function SignUp(props: SignUp.Props) {
  const { enableSignIn } = props

  const hostname = useAppStore((state) => state.referrer?.origin.hostname)

  const queued = Hooks.useRequest(porto)

  const respond = useMutation({
    mutationFn({ signIn }: { signIn?: boolean }) {
      if (!queued) throw new Error('no request queued.')
      if (queued.request.method !== 'wallet_connect')
        throw new Error('request is not a wallet_connect request.')

      const params = queued.request.params ?? []

      return Actions.respond(porto, {
        ...queued,
        request: {
          ...queued.request,
          params: [
            {
              ...params[0],
              capabilities: {
                ...params[0]?.capabilities,
                createAccount: !signIn,
              },
            },
          ],
        } as typeof queued.request,
      })
    },
  })

  return (
    <Layout loading={respond.isPending} loadingTitle="Signing up">
      <Layout.Header
        title="Sign up"
        icon={LucideLogIn}
        content={
          <>
            Create a new passkey wallet to start using{' '}
            <span className="font-medium">{hostname}</span>.
          </>
        }
      />

      <Layout.Footer className="space-y-3">
        <div className="flex gap-2 px-3">
          {enableSignIn ? (
            <Button
              type="button"
              onClick={() => respond.mutate({ signIn: true })}
            >
              Sign in
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => Actions.reject(porto, queued!)}
            >
              No thanks
            </Button>
          )}

          <Button
            className="flex-grow"
            type="button"
            variant="primary"
            onClick={() => respond.mutate({})}
          >
            Sign up
          </Button>
        </div>
      </Layout.Footer>
    </Layout>
  )
}

export declare namespace SignUp {
  export type Props = {
    enableSignIn?: boolean
  }
}
