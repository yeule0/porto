import { useMutation } from '@tanstack/react-query'
import { Actions, Hooks } from 'porto/remote'

import { Button } from '~/components/Button'
import { Layout } from '~/components/Layout'
import { porto } from '~/lib/Porto'
import LucideLogIn from '~icons/lucide/log-in'

export function SignMessage({ message }: SignMessage.Props) {
  const request = Hooks.useRequest(porto)

  const respond = useMutation({
    mutationFn() {
      return Actions.respond(porto, request!)
    },
  })

  return (
    <Layout loading={respond.isPending} loadingTitle="Signing...">
      <Layout.Header>
        <Layout.Header.Default
          title="Sign Message"
          icon={LucideLogIn}
          content={<>Review the message to sign below.</>}
          variant="default"
        />
      </Layout.Header>

      <Layout.Content>
        <div className="rounded-lg bg-gray3">
          <div className="px-3 pt-2 font-medium text-[14px] text-gray10">
            Message
          </div>
          <div className="max-h-[300px] overflow-scroll px-3 pb-2">
            <p className="text-[14px] text-gray12">{message}</p>
          </div>
        </div>
      </Layout.Content>

      <Layout.Footer>
        <Layout.Footer.Actions>
          <Button
            className="flex-grow"
            type="button"
            onClick={() => Actions.reject(porto, request!)}
          >
            No thanks
          </Button>

          <Button
            className="flex-grow"
            type="button"
            variant="primary"
            onClick={() => respond.mutate()}
          >
            Sign message
          </Button>
        </Layout.Footer.Actions>

        <Layout.Footer.Wallet />
      </Layout.Footer>
    </Layout>
  )
}

export namespace SignMessage {
  export type Props = {
    message: string
  }
}
