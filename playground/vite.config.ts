import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { createServer } from 'prool'
import { anvil } from 'prool/instances'
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    mkcert(),
    react(),
    tailwindcss(),
    {
      name: 'anvil',
      async configureServer() {
        await createServer({
          instance(key) {
            return anvil({
              chainId: key,
              forkUrl: 'https://eth.merkle.io',
              hardfork: 'Prague',
              // @ts-ignore
              odyssey: true,
              loadState: resolve(import.meta.dirname, './anvil.json'),
              dumpState: resolve(import.meta.dirname, './anvil.dump.json'),
            })
          },
          port: 8545,
        }).start()
      },
    },
  ],
})
