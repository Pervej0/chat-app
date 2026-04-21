---
description: Add a new Socket.IO event handler to the chat API
---

## Current socket handlers
!`cat src/socket/index.ts`

## emitToConversation usage examples
!`grep -rn "emitToConversation" src/ --include="*.ts"`

Add a new Socket.IO event for `$ARGUMENTS` following the existing patterns above.

### Rules to follow:

1. **Handler location** — add the handler inside `initializeSocket(io)` in `src/socket/index.ts`
2. **Auth** — validate the user is authenticated before processing any event data
3. **Room joining** — use `socket.join(\`conversation:\${conversationId}\`)` pattern for room management
4. **Emit order** — always write to the database first, then call `emitToConversation()` — never before
5. **Error handling** — emit an error event back to the sender on failure, do not silently swallow errors
6. **Payload shape** — document the expected payload shape in a comment above the handler
7. **Cleanup** — register a corresponding disconnect/leave handler if the event joins a room

After adding the handler, confirm `npx tsc --noEmit` passes.
