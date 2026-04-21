---
description: Review the current branch diff for issues before merging
---

## Changed files
!`git diff --name-only main...HEAD`

## Full diff
!`git diff main...HEAD`

Review the above changes against the project conventions:

1. **Architecture** — does every new file follow the router → controller → service → model pattern?
2. **Error handling** — are all errors using `CustomError(message, statusCode)`, not plain `Error` with manual `statusCode`?
3. **Auth guards** — does every protected controller check `req.user?.userId` before proceeding?
4. **ObjectIds** — are all Mongoose IDs valid 24-char hex strings? Flag any placeholder like `"conv123"`.
5. **Socket events** — is `emitToConversation` called only after a successful database write?
6. **Async handlers** — are controllers using `asyncHandler` or try/catch with `next(error)`?
7. **Response format** — do all responses return `ApiResponse<T>` shape?
8. **Tests** — does every new `src/**/*.ts` file have a corresponding `__tests__/` file?
9. **Service auth** — do update/delete services return `null` on auth failure (not throw), and do controllers map that to 404?

Give specific, actionable feedback per file. Flag blockers separately from suggestions.
