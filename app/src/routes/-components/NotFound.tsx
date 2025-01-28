import { Actions, Hooks } from 'porto/remote'
import * as React from 'react'

import LucideTriangleAlert from '~icons/lucide/triangle-alert'
import { Button } from '../../components/Button'
import { Layout } from '../../components/Layout'
import { porto } from '../../lib/porto'

export function NotFound() {
  const [loading, setLoading] = React.useState(false)

  const request = Hooks.useRequest(porto)

  return (
    <Layout loading={loading} loadingTitle="Responding">
      <Layout.Header
        title="Method Not implemented"
        icon={LucideTriangleAlert}
        content={
          <>
            UI support for method "{request?.request?.method}" is not
            implemented yet. You may still proceed by rejecting or responding.
          </>
        }
        variant="warning"
      />
      <Layout.Content>
        <pre className="my-2.5 max-h-[600px] overflow-scroll rounded-lg border border-blackA1 bg-blackA1 p-3 text-[14px] text-gray12 leading-[22px] dark:border-whiteA1 dark:bg-whiteA1">
          {JSON.stringify(request?.request ?? {}, null, 2)}
        </pre>
      </Layout.Content>
      <Layout.Footer>
        <div className="flex gap-2">
          <Button
            className="flex-grow"
            type="button"
            onClick={() => Actions.reject(porto, request!)}
          >
            Reject
          </Button>

          <Button
            className="flex-grow"
            type="button"
            variant="warning"
            onClick={() => {
              setLoading(true)
              Actions.respond(porto, request!).finally(() => setLoading(false))
            }}
          >
            Respond
          </Button>
        </div>
      </Layout.Footer>
    </Layout>
  )
}
