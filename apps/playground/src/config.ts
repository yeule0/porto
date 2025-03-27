import { Env, Porto as PortoConfig } from '@porto/apps'
import { exp1Address, exp2Address } from '@porto/apps/contracts'
import { Hex, Value } from 'ox'
import { Dialog, Implementation, Porto } from 'porto'

export const env = Env.get()

const hosts = {
  local: import.meta.env.PROD
    ? 'https://localhost:5174/dialog/'
    : 'https://local.localhost:5174/dialog/',
  stg: import.meta.env.PROD
    ? 'https://stg.id.porto.sh/dialog/'
    : 'https://stg.localhost:5174/dialog/',
  prod: import.meta.env.PROD
    ? 'https://id.porto.sh/dialog/'
    : 'https://localhost:5174/dialog/',
} as const satisfies Record<Env.Env, string>
const host = hosts[env]

export const permissions = () =>
  ({
    expiry: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    permissions: {
      calls: [
        {
          to: exp1Address,
        },
        {
          to: exp2Address,
        },
      ],
      spend: [
        {
          limit: Hex.fromNumber(Value.fromEther('50')),
          period: 'minute',
          token: exp1Address,
        },
      ],
    },
  }) as const

export const implementations = {
  local: Implementation.local(),
  'iframe-dialog': Implementation.dialog({
    host,
  }),
  'popup-dialog': Implementation.dialog({
    host,
    renderer: Dialog.popup(),
  }),
  'inline-dialog': Implementation.dialog({
    host,
    renderer: Dialog.experimental_inline({
      element: () => document.getElementById('porto')!,
    }),
  }),
}
export type ImplementationType = keyof typeof implementations

export const porto = Porto.create({
  ...PortoConfig.config[env],
  // We will be deferring implementation setup until after hydration.
  implementation: null,
})
