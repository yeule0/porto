export const defaultEnv = 'prod'

export const envs = ['local', 'stg', 'prod'] as const
export type Env = 'local' | 'stg' | 'prod'

export function get(): Env {
  const host_ = window.location.host.split('.')[0]
  return envs.includes(host_ as Env) ? (host_ as Env) : defaultEnv
}
