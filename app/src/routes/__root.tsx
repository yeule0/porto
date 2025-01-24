import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { Actions, type Porto } from 'porto/remote'
import * as React from 'react'

import LucideGlobe from '~icons/lucide/globe'
import LucideX from '~icons/lucide/x'
import { type appStore, useAppStore } from '../lib/app'
import { porto } from '../lib/porto'

export const Route = createRootRouteWithContext<{
  appState: appStore.State
  portoState: Porto.State
}>()({
  component: RouteComponent,
})

function RouteComponent() {
  const mode = useAppStore((state) => state.mode)
  const hostname = useAppStore((state) => state.referrer?.hostname)

  const elementRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height, width } = entry.contentRect
        if (mode === 'popup')
          window.resizeTo(width, height + 30) // add 30px to account for title bar
        else
          porto.messenger.send('__internal', {
            type: 'resize',
            height: height + 2,
            width: width + 2,
          })
      }
    })

    resizeObserver.observe(element)
    return () => {
      resizeObserver.unobserve(element)
    }
  }, [mode])

  return (
    <div
      ref={elementRef}
      {...{ [`data-${mode}`]: '' }} // for conditional styling based on dialog mode ("in-data-iframe:..." or "in-data-popup:...")
      className="flex h-fit min-w-dialog flex-col overflow-hidden border-blackA1 bg-gray1 data-iframe:max-w-dialog data-iframe:rounded-[14px] data-iframe:border dark:border-whiteA1 dark:bg-gray2"
    >
      <header className="flex items-center justify-between border-blackA1 border-b bg-blackA1 px-3 pt-2 pb-1.5 dark:border-whiteA1 dark:bg-whiteA1">
        <div className="flex items-center gap-2">
          <div className="flex size-5 items-center justify-center rounded-[5px] bg-gray6">
            <LucideGlobe className="size-3.5 text-black dark:text-white" />
          </div>
          <div className="font-normal text-[14px] text-gray9 leading-[22px]">
            {hostname}
          </div>
        </div>

        <button
          type="button"
          onClick={() => Actions.rejectAll(porto)}
          title="Close Dialog"
        >
          <LucideX className="size-4.5 text-gray9" />
        </button>
      </header>

      <Outlet />

      <React.Suspense>
        <TanStackRouterDevtools position="bottom-right" />
      </React.Suspense>
    </div>
  )
}

const TanStackRouterDevtools =
  import.meta.env.PROD || window !== window.parent || Boolean(window.opener)
    ? () => null
    : React.lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      )
