import { Button } from '~/components/Button'
import { Layout } from '~/components/Layout'
import * as Dialog from '~/lib/Dialog'
import LucideLogIn from '~icons/lucide/log-in'

export function SignIn(props: SignIn.Props) {
  const { loading, onApprove, onReject } = props

  const hostname = Dialog.useStore((state) => state.referrer?.origin.hostname)

  return (
    <Layout loading={loading} loadingTitle="Signing in...">
      <Layout.Header className="flex-grow">
        <Layout.Header.Default
          title="Sign in"
          icon={LucideLogIn}
          content={
            <>
              Sign in with your wallet to continue using{' '}
              <span className="font-medium">{hostname}</span>.
            </>
          }
        />
      </Layout.Header>

      <Layout.Footer>
        <Layout.Footer.Actions>
          <Button type="button" onClick={onReject}>
            No thanks
          </Button>

          <Button
            className="flex-grow"
            type="button"
            variant="primary"
            onClick={onApprove}
          >
            Sign in
          </Button>
        </Layout.Footer.Actions>

        <Layout.Footer.Wallet />
      </Layout.Footer>
    </Layout>
  )
}

export declare namespace SignIn {
  type Props = {
    loading: boolean
    onApprove: () => void
    onReject: () => void
  }
}
