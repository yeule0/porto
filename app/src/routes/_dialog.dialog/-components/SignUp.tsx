import LucideLogIn from '~icons/lucide/log-in'

import { Button } from '~/components/Button'
import { Layout } from '~/components/Layout'
import * as Dialog from '~/lib/Dialog'

export function SignUp(props: SignUp.Props) {
  const { enableSignIn, loading, onApprove, onReject } = props

  const hostname = Dialog.useStore((state) => state.referrer?.origin.hostname)

  return (
    <Layout loading={loading} loadingTitle="Signing up...">
      <Layout.Header className="flex-grow">
        <Layout.Header.Default
          title="Sign up"
          icon={LucideLogIn}
          content={
            <>
              Create a new passkey wallet to start using{' '}
              <span className="font-medium">{hostname}</span>.
            </>
          }
        />
      </Layout.Header>

      <Layout.Footer>
        <Layout.Footer.Actions>
          {enableSignIn ? (
            <Button type="button" onClick={() => onApprove({ signIn: true })}>
              Sign in
            </Button>
          ) : (
            <Button type="button" onClick={onReject}>
              No thanks
            </Button>
          )}

          <Button
            className="flex-grow"
            type="button"
            variant="primary"
            onClick={() => onApprove({})}
          >
            Sign up
          </Button>
        </Layout.Footer.Actions>
      </Layout.Footer>
    </Layout>
  )
}

export declare namespace SignUp {
  export type Props = {
    enableSignIn?: boolean
    loading?: boolean
    onApprove: (p: { signIn?: boolean }) => void
    onReject: () => void
  }
}
