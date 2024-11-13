'use client'
import { oddworld } from '@/config'
import { db, id, tx } from '@/db'
import * as React from 'react'

// TODO:
// - db + persist sessions
// - create post
// - send tip

export default function Page() {
  const { isLoading, user, error } = db.useAuth()

  const { data: postsData } = db.useQuery({
    posts: {
      author: {},
      $: {
        order: {
          serverCreatedAt: 'desc',
        },
      },
    },
  })

  if (error) return <div>Uh oh! {error.message}</div>
  if (isLoading) return <div />

  return (
    <main className="flex flex-col items-start gap-4 p-2">
      <div className="flex gap-2.5 items-baseline">
        <h1 className="font-bold m-0 text-base">Oddblog</h1>
        {user && (
          <button type="button" onClick={() => db.auth.signOut()}>
            Log out
          </button>
        )}
      </div>

      {user ? (
        <form
          className="flex flex-col  max-w-[200px]"
          onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const formData = new FormData(event.currentTarget)
            const title = formData.get('title') as string
            const text = formData.get('text')
            await db.transact(
              tx.posts[id()]
                .update({
                  createdAt: Date.now(),
                  title,
                  text,
                  slug: title
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, ''),
                })
                .link({ author: user.id }),
            )
            form.reset()
          }}
        >
          <input type="text" name="title" placeholder="Title" required />
          <textarea
            name="text"
            placeholder="As you set out for Ithaca…"
            required
            rows={5}
          />
          <button type="submit" className="w-min">
            Post
          </button>
        </form>
      ) : (
        <Auth />
      )}

      <hr className="m-0 w-[400px]" />

      <div className="flex flex-col gap-6">
        {postsData?.posts.map((post) => (
          <div
            key={post.id + post.createdAt.toLocaleString()}
            className="flex flex-col gap-1 text-sm"
          >
            <h2 className="font-bold m-0 text-base">{post.title}</h2>
            <div className="text-xs">
              <time>{new Date(post.createdAt).toLocaleString()}</time>
            </div>

            <p className="m-0 whitespace-pre-line">{post.text}</p>
            <button type="button" className="text-xs leading-none mt-1 w-fit">
              Tip 1 $EXP
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

function Auth() {
  const [loading, setLoading] = React.useState<'login' | 'register' | null>(
    null,
  )

  return (
    <div className="flex gap-2.5 items-baseline">
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            // TODO: More robust auth
            await oddworld.provider.request({
              method: 'eth_requestAccounts',
            })
            const email = oddworld._internal.accounts?.[0].label
            setLoading('login')
            const data = await fetch('/api/auth', {
              method: 'POST',
              body: JSON.stringify({ email }),
            }).then((res) => res.json())
            db.auth.signInWithToken(data.token)
          } finally {
            setTimeout(() => setLoading(null), 1_000)
          }
        }}
      >
        <button type="submit" disabled={loading === 'login'}>
          {loading === 'login' ? 'Logging in' : 'Log in'}
        </button>
      </form>

      <span className="text-sm">or</span>

      <form
        onSubmit={async (event) => {
          event.preventDefault()
          try {
            // TODO: More robust auth
            const formData = new FormData(event.currentTarget)
            const email = formData.get('email') as string
            await oddworld.provider.request({
              method: 'experimental_registerAccount',
              params: [{ label: email }],
            })
            setLoading('register')
            const data = await fetch('/api/auth', {
              method: 'POST',
              body: JSON.stringify({ email }),
            }).then((res) => res.json())
            db.auth.signInWithToken(data.token)
          } finally {
            setTimeout(() => setLoading(null), 1_000)
          }
        }}
      >
        <input
          data-1p-ignore
          autoComplete="off"
          type="email"
          placeholder="name@example.com"
          name="email"
          required
        />
        <button type="submit" disabled={loading === 'register'}>
          {loading === 'register' ? 'Creating account' : 'Register'}
        </button>
      </form>
    </div>
  )
}
