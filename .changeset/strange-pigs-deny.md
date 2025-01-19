---
"porto": patch
---

Added support for Dialog Wallets (cross-origin iframes/popup) in Porto via `Implementation.dialog()`. 

- This feature is work-in-progress and currently has no UI.
- In the future, `Implementation.dialog()` will be the default behavior in Porto to communicate with a Wallet.
- Currently, the default implementation is `Implementation.local()` – where its behavior is to perform actions locally (ie. "blind sign").
- In the future, it will be anticipated for App builders to use `Implementation.dialog()` (the default), and for Dialog Wallet builders to use `Implemetation.local()`. 
- Documentation for these patterns will emerge as this feature matures.

If you would like to check out what the experience looks like currently with no UI:

```ts
import { Porto } from 'porto'

const porto = Porto.create({
  implementation: Implementation.dialog(),
})
```
