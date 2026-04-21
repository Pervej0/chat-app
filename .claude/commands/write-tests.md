---
description: Write or complete unit tests for a controller or service file
---

## File to test
!`cat $ARGUMENTS`

## Existing test example for reference
!`find src -name "*.test.ts" | head -1 | xargs cat`

Write complete unit tests for the file above following these patterns:

### Mocking rules
- Mock the service with `jest.mock("../relative-path-to-service")` — path relative to the **controller**, not the test file
- Mock `src/middleware/auth.ts` if testing protected routes
- For Mongoose Query chains (`.find().populate().sort().limit()`), use:
  ```ts
  jest.spyOn(Model, 'find').mockReturnValue(mockQuery as any)
  // where mockQuery.populate().sort().limit() resolves to the mock data
  ```

### ObjectId rules
- Always use valid 24-char hex strings: `"507f1f77bcf86cd799439011"`
- Never use short strings like `"user1"` or `"conv123"` — they cause `BSONError` in Mongoose validators

### Test structure for each controller handler
1. Happy path — correct input, assert 200/201 and `ApiResponse<T>` shape
2. Missing auth — no `req.user`, assert 401
3. Not found / null service return — assert 404
4. Service throws — assert 500 via error handler

### Response shape to assert
```ts
expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
  success: true,
  data: expect.any(Object),
  timestamp: expect.any(String)
}))
```

Ensure all tests pass with `npx jest $ARGUMENTS --no-coverage` after writing.
