# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

claude-app is a professional Node.js Express server built with TypeScript. It provides a clean API foundation with security middleware and error handling.

## Commands

```bash
npm run build    # Compile TypeScript to dist/
npm start        # Run production server from dist/
npm run dev      # Run in development mode with hot reload
```

## Architecture

The app follows a layered Express architecture:

- **Entry**: `src/index.ts` creates the app via `createApp()` and starts the HTTP server
- **App Setup**: `src/app.ts` configures middleware stack (helmet → cors → body parser → logger → routes → error handler)
- **Routes**: `src/routes/` defines API endpoints, organized in subdirectories with `<feature>.controller.ts` and `<feature>.router.ts`
- **Middleware**: `src/middleware/` contains `errorHandler.ts` (catch-all error responses) and `requestLogger.ts` (Morgan HTTP logging)
- **Config**: `src/config/index.ts` loads environment variables via dotenv

**API Route Pattern**: Routes are mounted under `/api`, e.g., `/api/health`

## Key Conventions

- Controllers return `ApiResponse<T>` objects with `{ success, data, message, timestamp }`
- Error handler sets `statusCode` property on Error objects for HTTP status codes
- Graceful shutdown handles SIGTERM and SIGINT signals