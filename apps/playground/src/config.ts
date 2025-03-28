import { Env, Porto as PortoConfig } from '@porto/apps'
import { exp1Address, exp2Address } from '@porto/apps/contracts'
import { Hex, Value } from 'ox'
import { Dialog, Implementation, Porto } from 'porto'

export const env = Env.get()

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

const host = PortoConfig.dialogHosts[env]
export const implementations = {
  local: Implementation.contract(),
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
