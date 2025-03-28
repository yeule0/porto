---
"porto": patch
---

Renamed `Implementation.local` to `Mode.contract`.

```diff
- import { Implementation } from 'porto'
+ import { Mode } from 'porto'

const porto = Porto.create({
- implementation: Implementation.local(),
+ mode: Mode.contract(),
})
```
