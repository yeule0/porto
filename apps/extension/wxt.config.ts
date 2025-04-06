import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  manifest: {
    name: 'Porto',
  },
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    build: {
      rollupOptions: {
        external: ['wxt/storage'],
      },
    },
  }),
})
