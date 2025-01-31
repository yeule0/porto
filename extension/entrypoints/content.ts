import { Porto } from 'porto'

export default defineContentScript({
  matches: ['https://*/*', 'http://localhost/*'],
  runAt: 'document_end',
  world: 'MAIN',
  main() {
    const porto = Porto.create()
    ;(window as any).ethereum = porto.provider
  },
})
