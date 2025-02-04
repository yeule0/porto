---
"porto": patch
---

**Breaking:** Simplified `experimental_authorizeKey` parameters.

- Made `expiry` and `permissions` required.
- Removed `role` – all keys are now `role="session"`.
