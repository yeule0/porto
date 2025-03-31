import { Button } from '@porto/apps/components'

import * as Dialog from '~/lib/Dialog'
import { Layout } from '~/routes/-components/Layout'
import LucideLogIn from '~icons/lucide/log-in'

export function SignMessage(props: SignMessage.Props) {
  const { message, loading, onApprove, onReject } = props

  return (
    <Layout loading={loading} loadingTitle="Signing...">
      <Layout.Header>
        <Layout.Header.Default
          title="Sign Message"
          icon={LucideLogIn}
          content={<>Review the message to sign below.</>}
          variant="default"
        />
      </Layout.Header>

      <Layout.Content>
        <div className="rounded-lg bg-surface">
          <div className="px-3 pt-2 font-medium text-[14px] text-secondary">
            Message
          </div>
          <div className="max-h-[160px] overflow-scroll px-3 pb-2">
            <pre className="whitespace-pre-wrap font-sans text-[14px] text-primary">
              {message}
            </pre>
          </div>
        </div>
      </Layout.Content>

      <Layout.Footer>
        <Layout.Footer.Actions>
          <Button
            className="flex-grow"
            type="button"
            onClick={() => onReject()}
          >
            No thanks
          </Button>

          <Button
            className="flex-grow"
            type="button"
            variant="accent"
            onClick={() => onApprove()}
          >
            Sign message
          </Button>
        </Layout.Footer.Actions>

        <Layout.Footer.Account />
      </Layout.Footer>
    </Layout>
  )
}

export namespace SignMessage {
  export type Props = {
    message: string
    loading?: boolean | undefined
    onApprove: () => void
    onReject: () => void
  }

  export function Siwe(props: Siwe.Props) {
    const { loading, onApprove, onReject } = props

    const hostname = Dialog.useStore((state) => state.referrer?.origin.hostname)

    return (
      <Layout loading={loading} loadingTitle="Authenticating...">
        <Layout.Header className="flex-grow">
          <Layout.Header.Default
            title="Authenticate"
            icon={LucideLogIn}
            content={
              <>
                Authenticate <span className="font-medium">{hostname}</span>{' '}
                with your passkey to continue.
              </>
            }
          />
        </Layout.Header>

        <Layout.Footer>
          <Layout.Footer.Actions>
            <Button type="button" onClick={() => onReject()}>
              No thanks
            </Button>

            <Button
              className="flex-grow"
              type="button"
              variant="accent"
              onClick={() => onApprove()}
            >
              Approve
            </Button>
          </Layout.Footer.Actions>

          <Layout.Footer.Account />
        </Layout.Footer>
      </Layout>
    )
  }

  export namespace Siwe {
    export type Props = {
      loading?: boolean | undefined
      onApprove: () => void
      onReject: () => void
    }
  }
}
