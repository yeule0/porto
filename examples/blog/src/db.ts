import { init } from '@instantdb/react'

// Optional: Declare your schema for intellisense!
export type Schema = {
  posts: {
    body: string
    createdAt: number
    text: string
    title: string
  }
}

export const db = init<Schema>({
  appId: '9f416eaa-5537-4025-81a6-e0962363e433',
  devtool: false,
})

export { id, tx } from '@instantdb/react'
