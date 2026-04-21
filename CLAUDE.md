# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build        # Compile TypeScript to dist/
npm start            # Run production server from dist/
npm run dev          # Run in development with ts-node hot reload
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

**Run a single test file:**

```bash
npx jest src/modules/message/__tests__/message.controller.test.ts --no-coverage
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

### Testing

Tests live co-located in `__tests__/` folders alongside the files they test. Key patterns:

- Mock dependencies with `jest.mock("<relative-path-from-controller>")` — paths must match where the controller imports from, not the test file location
- Mongoose Query chains (`.find().populate().sort().limit()`) must be mocked with `jest.spyOn(Model, 'find').mockReturnValue(mockQuery as any)` where `mockQuery.limit()` returns a promise
- Use valid 24-character hex strings for ObjectId values (e.g. `"507f1f77bcf86cd799439013"`)
- `requestLogger` skips logging automatically in test environment

### Response Format

All controllers return `ApiResponse<T>`: `{ success: boolean; data?: T; message?: string; timestamp: string }`
