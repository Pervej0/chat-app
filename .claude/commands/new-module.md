---
description: Scaffold a complete new Express module with router, controller, service, and test file
---

## Project structure
!`find src/modules -maxdepth 1 -type d`

## Existing module example (messages)
!`ls src/modules/message/`

Scaffold a new module following the exact same pattern as the existing modules above.

### Required files to create for module `$ARGUMENTS`:

1. `src/modules/$ARGUMENTS/$ARGUMENTS.router.ts`
   - Import controller handlers
   - Mount routes with auth middleware where needed
   - Export the router

2. `src/modules/$ARGUMENTS/$ARGUMENTS.controller.ts`
   - Use `asyncHandler` from `src/middleware/errorHandler.ts`
   - Accept `AuthRequest` from `src/types/index.ts` for protected routes
   - Check `req.user?.userId` first on every protected handler
   - Return `ApiResponse<T>` shape on all responses
   - Use `CustomError(message, statusCode)` for all errors

3. `src/modules/$ARGUMENTS/$ARGUMENTS.service.ts`
   - Business logic and Mongoose operations only
   - Return `null` on authorization failure (not 403 error)
   - No Express types here — pure data in, data out

4. `src/modules/$ARGUMENTS/__tests__/$ARGUMENTS.controller.test.ts`
   - Mock service with `jest.mock("../$ARGUMENTS.service")`
   - Use valid 24-char hex ObjectIds: `"507f1f77bcf86cd799439011"`
   - Mock Mongoose Query chains with `jest.spyOn(Model, 'find').mockReturnValue(mockQuery as any)`

5. Register the router in `src/app.ts` under `/api/v1/$ARGUMENTS`

After creating all files, run `npx tsc --noEmit` to confirm no type errors.
