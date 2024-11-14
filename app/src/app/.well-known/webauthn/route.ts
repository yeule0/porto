import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()
const ratelimit = new Ratelimit({
  redis,
  // don't want folks adding origins too often.
  limiter: Ratelimit.slidingWindow(1, '60 s'),
  prefix: '@upstash/ratelimit',
})

export async function GET(_: Request) {
  const origins = await redis.smembers('webauthn:origins')
  return Response.json({
    origins,
  })
}

export async function PATCH(request: Request) {
  const { success } = await ratelimit.limit('webauthn:ratelimit')
  if (!success)
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })

  const { origin } = await request.json()
  await redis.sadd('webauthn:origins', origin)
  return Response.json({ success: true })
}
