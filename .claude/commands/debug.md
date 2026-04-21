---
description: Diagnose a failing test or runtime error in the chat API
---

## Failing test or error output
!`npx jest --no-coverage 2>&1 | tail -60`

## Recent git changes
!`git diff HEAD~1 --name-only`

Diagnose the failure above. Check in this order:

1. **BSONError** — is a Mongoose ObjectId receiving a non-24-char-hex string? Check test mocks for placeholder IDs like `"user1"`, `"msg123"`.
2. **jest.mock path** — is the mock path relative to the controller file, not the test file? E.g. `jest.mock("../message.service")` not `jest.mock("../../message.service")`.
3. **Mongoose Query chain** — does the mock chain cover every chained method? If the controller calls `.find().populate().sort().limit()`, the mock must chain all four.
4. **Type error** — run `npx tsc --noEmit` and check if a TypeScript error is causing the runtime failure.
5. **Auth middleware** — is `req.user` populated in the test? Protected handlers need `req.user = { userId: "507f1f77bcf86cd799439011" }`.
6. **CustomError vs plain Error** — is the error handler receiving a plain `Error` when it expects `CustomError`? Check the `statusCode` property.

Provide the exact fix with the corrected code snippet.
