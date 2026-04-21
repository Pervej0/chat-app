# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Goals

- Build a production-ready chat API with real-time messaging via Socket.IO
- Maintain high test coverage for controllers and services
- Follow layered module architecture: router → controller → service → model

## Commands

```bash
npm run build         # Compile TypeScript to dist/
npm start             # Run production server from dist/
npm run dev           # Run in development with ts-node hot reload
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

**Run a single test file:**

```bash
npx jest src/modules/message/__tests__/message.controller.test.ts --no-coverage
```

**Type-check without emitting:**

```bash
npx tsc --noEmit
```

## Architecture

### Entry Points

- `src/index.ts` — starts the HTTP server (combines Express + Socket.IO), handles graceful shutdown on SIGTERM/SIGINT
- `src/app.ts` — exports `createApp()`, the Express app factory

### API Structure

Routes are mounted at `/api/v1` with these prefixes:

- `/api/v1/auth` — auth module
- `/api/v1/users` — user module
- `/api/v1/conversations` — conversation module
- `/api/v1/messages` — message module

### Module Pattern

Each module follows a layered pattern in `src/modules/<name>/`:

- `<name>.router.ts` — Express Router, mounts controller handlers
- `<name>.controller.ts` — request handlers, validation, response formatting
- `<name>.service.ts` — business logic, database operations

### Middleware

- `src/middleware/errorHandler.ts` — catches all errors, maps them to HTTP status codes. Use `CustomError` class (which sets `statusCode`) or throw plain `Error` for 500
- `src/middleware/requestLogger.ts` — Morgan HTTP logger; automatically skipped when `NODE_ENV=test`

### Auth

- `src/middleware/auth.ts` — validates Bearer JWT token, attaches `TokenPayload` to `req.user`
- `src/types/index.ts` — `AuthRequest` extends `Request` with optional `user?: TokenPayload`

### Socket.IO

- `src/socket/index.ts` — `initializeSocket(io)` sets up all socket handlers
- `emitToConversation(conversationId, event, data)` broadcasts to the `conversation:<id>` room

### Config

- `src/core/index.ts` — loads `.env`, exports `config` object (port, nodeEnv, corsOrigin, database.mongoUri, jwt.secret, jwt.accessExpiry, jwt.refreshExpiry)

### Models

Mongoose models in `src/models/` (Message, Conversation, User, Auth)

## Testing

Tests live co-located in `__tests__/` folders alongside the files they test.

### Key Patterns

- Mock dependencies with `jest.mock("<relative-path-from-controller>")` — paths must match where the controller imports from, not the test file location
- Mongoose Query chains (`.find().populate().sort().limit()`) must be mocked with `jest.spyOn(Model, 'find').mockReturnValue(mockQuery as any)` where `mockQuery.limit()` returns a promise
- Use valid 24-character hex strings for ObjectId values (e.g. `"507f1f77bcf86cd799439013"`)
- `requestLogger` skips logging automatically in test environment

### When creating a new `src/**/*.ts` file

Check whether a corresponding `__tests__/` file should be created alongside it.

### When creating a new `__tests__/*.test.ts` file

Write unit tests following these patterns: mock services with `jest.mock()`, use valid 24-char hex ObjectIds, spy on Mongoose Query chains.

## Response Format

All controllers return `ApiResponse<T>`:

```ts
{ success: boolean; data?: T; message?: string; timestamp: string }
```

## Best Practices

**Errors:** Use `CustomError` from `src/middleware/errorHandler.ts` for all error cases — it accepts `(message, statusCode)` and is caught by the global error handler. Do not manually set `statusCode` on plain `Error` objects.

**ObjectIds:** Always use valid 24-character hex strings. Never use placeholder strings like `"conv123"` in production code or tests — they will cause `BSONError` at runtime.

**Async handlers:** Controllers are `async` — wrap with `asyncHandler` from `src/middleware/errorHandler.ts` OR use try/catch and call `next(error)`.

**Auth guards:** Every protected route handler must check `req.user?.userId` first and call `next(new CustomError("Unauthorized", 401))` if missing. Do not assume the auth middleware ran.

**Socket events:** When emitting socket events from controllers, always call `emitToConversation` after the database write succeeds, not before.

**Test mocking paths:** `jest.mock()` paths are relative to the file under test, not the test file. If `message.controller.ts` imports `from "../message.service"`, the mock must be `jest.mock("../message.service")` even if the test file lives in `__tests__/`.

**Service method authorization:** Services that enforce user ownership (update, delete) return `null` or `false` on authorization failure — controllers must check and call `next(new CustomError(..., 404))` (not 403) to avoid leaking existence information.
