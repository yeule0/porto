import { Porto } from 'porto'

export default defineContentScript({
  main() {
    const porto = Porto.create()
    ;(window as any).ethereum = porto.provider
  },
  matches: ['https://*/*', 'http://localhost/*'],
  runAt: 'document_end',
  world: 'MAIN',
})
