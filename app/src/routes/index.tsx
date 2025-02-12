import { createFileRoute } from '@tanstack/react-router'

import { Button } from '~/components/Button'
import { IthacaMark } from '~/components/IthacaMark'
import { PortoLogo } from '../components/PortoLogo'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-[20%]">
        <PortoLogo />
      </div>
      {/* <div className="mx-auto w-full max-w-[768px] space-y-6 px-4">
        <div className="space-y-4">
          <p className="font-medium text-[34px] leading-[24px]">Porto</p>
          <p className="font-normal text-[19px] leading-[22px]">
            A home for your digital assets,
            <br />
            powered by{' '}
            <a
              className="font-medium text-accent"
              href="https://ithaca.xyz"
              rel="noreferrer"
              target="_blank"
            >
              Ithaca
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="accent">Create wallet</Button>
          <Button>Sign in</Button>
        </div>
      </div> */}
      {/* <div className="fixed right-0 h-[80dvh] max-[768px]:hidden max-[1024px]:h-[70dvh]">
        <IthacaMark />
      </div> */}
    </div>
  )
}
