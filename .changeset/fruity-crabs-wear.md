---
"porto": patch
---

Renamed `implementation` to `mode`. It's cleaner.

```diff
- import { Porto, Implementation } from 'porto'
+ import { Porto, Mode } from 'porto'

const porto = Porto.create({
- implementation: Implementation.dialog(),
+ mode: Mode.dialog(),
})
```
