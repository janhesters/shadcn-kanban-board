# Supabase Mock Handlers

This directory contains mock handlers for Supabase authentication endpoints, enabling testing without connecting to the real Supabase service. Unlike simpler mocking approaches that might use in-memory storage, this system persists mock session data in a database, ensuring consistent session state across different testing environments (e.g., Playwright browser tests, unit tests, and server-side scenarios).

## Why This System is Needed

### The Core Problem

When testing an application that relies on Supabase authentication, we encounter several challenges that a basic in-memory mock cannot adequately address:

1. **Session State Consistency**
   - Supabase authentication involves a session object with critical data: an `access_token`, `refresh_token`, and user details.
   - When a user logs in during a test, the mock system must return this same session data whenever Supabase client methods like `supabase.auth.getUser()` or `supabase.auth.getSession()` are called.
   - Without a reliable way to persist and retrieve this session state, authentication-dependent features (e.g., protected routes or API calls) break during tests.

2. **Cross-Environment Session Sharing**
   - Tests often run in isolated environments: Playwright simulates browser interactions, unit tests run in Node.js, and server-side tests might involve API requests.
   - Each environment needs access to the same session data to simulate a logged-in user consistently.
   - An in-memory solution (like a JavaScript `Map`) is limited to a single process and cannot share state across these environments, especially in parallel test runs or browser-server interactions.

3. **Realistic Simulation of Supabase Behavior**
   - Supabase persists session data server-side and ties it to tokens, which the client uses to authenticate requests.
   - To mimic this behavior accurately, our mocks need a persistent storage mechanism that ties session data to tokens, rather than ephemeral in-memory storage that resets with each test run or process.

### Why a Database-Backed Solution?

We address these challenges by persisting mock sessions in a database table (`MockAccessTokenSession`) rather than relying on in-memory storage like a `Map`. Here’s why this architecture is critical:

- **Persistence Across Environments**: By storing sessions in a database, all test environments—whether a Playwright browser context, a Node.js unit test, or a server-side API call—can access the same session data using the `access_token` as a key.
- **Realistic Mocking**: This mirrors how Supabase manages sessions in production (stored server-side and retrieved via tokens), making our tests more representative of real-world behavior.
- **Scalability and Reliability**: Unlike an in-memory `Map` that’s confined to a single process and lost on restart, a database persists data across test runs, parallel processes, and even test failures, ensuring consistent state management.

### How It Solves the Problem

This system:
1. Stores mock sessions in a database table (`MockAccessTokenSession`) with the `access_token` as the primary key.
2. Provides utility functions (`setMockSession`, `getMockSession`) to manage session data, accessible from any test context.
3. Ensures that when the Supabase client queries endpoints like `/auth/v1/user`, the mock handlers retrieve the correct session data from the database, maintaining authentication state across the test lifecycle.

This approach guarantees that a session created in one test environment (e.g., a Playwright login flow) is available to another (e.g., a server-side API check), just as it would be in a real Supabase deployment.

Below is an updated version of your README.md that incorporates the problem analysis and solution explanation from my earlier response. This enhances the document by providing a concrete example of a common issue (mismatched session data) and explaining how the database-backed architecture resolves it, making it even clearer for new team members onboarding to the project. The structure remains consistent with your existing content, with the new section seamlessly integrated.

md

Collapse

Wrap

Copy
# Supabase Mock Handlers

This directory contains mock handlers for Supabase authentication endpoints, enabling testing without connecting to the real Supabase service. Unlike simpler mocking approaches that might use in-memory storage, this system persists mock session data in a database, ensuring consistent session state across different testing environments (e.g., Playwright browser tests, unit tests, and server-side scenarios).

## Why This System is Needed

### The Core Problem

When testing an application that relies on Supabase authentication, we encounter several challenges that a basic in-memory mock cannot adequately address:

1. **Session State Consistency**
   - Supabase authentication involves a session object with critical data: an `access_token`, `refresh_token`, and user details.
   - When a user logs in during a test, the mock system must return this same session data whenever Supabase client methods like `supabase.auth.getUser()` or `supabase.auth.getSession()` are called.
   - Without a reliable way to persist and retrieve this session state, authentication-dependent features (e.g., protected routes or API calls) break during tests.

2. **Cross-Environment Session Sharing**
   - Tests often run in isolated environments: Playwright simulates browser interactions, unit tests run in Node.js, and server-side tests might involve API requests.
   - Each environment needs access to the same session data to simulate a logged-in user consistently.
   - An in-memory solution (like a JavaScript `Map`) is limited to a single process and cannot share state across these environments, especially in parallel test runs or browser-server interactions.

3. **Realistic Simulation of Supabase Behavior**
   - Supabase persists session data server-side and ties it to tokens, which the client uses to authenticate requests.
   - To mimic this behavior accurately, our mocks need a persistent storage mechanism that ties session data to tokens, rather than ephemeral in-memory storage that resets with each test run or process.

### Why a Database-Backed Solution?

We address these challenges by persisting mock sessions in a database table (`MockAccessTokenSession`) rather than relying on in-memory storage like a `Map`. Here’s why this architecture is critical:

- **Persistence Across Environments**: By storing sessions in a database, all test environments—whether a Playwright browser context, a Node.js unit test, or a server-side API call—can access the same session data using the `access_token` as a key.
- **Realistic Mocking**: This mirrors how Supabase manages sessions in production (stored server-side and retrieved via tokens), making our tests more representative of real-world behavior.
- **Scalability and Reliability**: Unlike an in-memory `Map` that’s confined to a single process and lost on restart, a database persists data across test runs, parallel processes, and even test failures, ensuring consistent state management.
- **Simplified Cleanup**: A database allows programmatic cleanup (e.g., `clearMockSessions`) to reset the test environment, avoiding lingering state issues common with in-memory mocks.

### How It Solves the Problem

This system:
1. Stores mock sessions in a database table (`MockAccessTokenSession`) with the `access_token` as the primary key.
2. Provides utility functions (`setMockSession`, `getMockSession`) to manage session data, accessible from any test context.
3. Ensures that when the Supabase client queries endpoints like `/auth/v1/user`, the mock handlers retrieve the correct session data from the database, maintaining authentication state across the test lifecycle.

This approach guarantees that a session created in one test environment (e.g., a Playwright login flow) is available to another (e.g., a server-side API check), just as it would be in a real Supabase deployment.

## A Common Mismatch Example

To illustrate why this architecture is necessary, consider a typical issue encountered in simpler mock setups:

### Problem Analysis

- **Scenario**: You want the `getUser` mock handler to return the user from a session created in `createAuthenticatedRequest`, rather than generating a new mock user each time.
- **What Happens Without Persistence**:
  - `createAuthenticatedRequest` creates a `mockSession` with a user and encodes it into a cookie (`sb-<projectReference>-auth-token`).
  - The `getUser` mock handler checks the `Authorization` header for a token but has no way to link it back to the session’s user unless that data is persisted and shared.
  - Without a shared store, the handler might return a freshly generated user (e.g., via `createPopulatedSupabaseUser()`), leading to inconsistent user data across the test.

The mismatch arises because:

1. The session data is stored in a cookie, but the mock handler looks for an `Authorization` header, creating a disconnect in how the session is accessed.
2. There’s no persistent mechanism to tie the session’s user to the mock response, so the handler can’t reuse the original user data.

### Solution with Database Persistence

To fix this, we:

1. **Persist Session Data**: Store the `mockSession` (including `access_token` and `user`) in the database using `setMockSession` when creating the authenticated request.
2. **Link via Access Token**: Use the `access_token` as a key to retrieve the exact session data in the mock handler, ensuring consistency.
3. **Align Authentication**: The Supabase client extracts the `access_token` from the cookie and sends it in the `Authorization` header, which the handler uses to look up the session in the database.

This ensures the same user data flows from the request creation to the mock response, solving the consistency problem.

## Overview

The mock handlers simulate Supabase’s authentication endpoints:
- `auth.ts`: Defines MSW handlers for endpoints like `/auth/v1/user`, `/signInWithOtp`, and others.
- `mock-sessions.ts`: Provides database-backed session management utilities.
- `mock-sessions.test.ts`: Contains tests to verify session storage and retrieval.

Key database schema:

```prisma
model MockAccessTokenSession {
  accessToken String @id
  sessionData Json
}
```

## How It Works

### 1. Session Storage

Sessions are persisted in the `MockAccessTokenSession` table:
- **Key**: `accessToken` (a unique string, typically the `access_token` from a Supabase session).
- **Value**: `sessionData` (a JSON object containing the full session, including `user`, `access_token`, `refresh_token`, etc.).
- **Purpose**: Allows any test environment to look up a session by its `access_token`, mimicking Supabase’s server-side session store.

### 2. Key Components

#### Mock Session Management (`mock-sessions.ts`)
- **`setMockSession`**: Saves or updates a session in the database, tied to an `access_token`.
- **`getMockSession`**: Retrieves a session by `access_token`, with type safety via a `isSession` guard.
- **`deleteMockSession`**: Removes a specific session.
- **`clearMockSessions`**: Deletes all sessions, used for test cleanup.

#### Auth Handlers (`auth.ts`)
These MSW handlers simulate Supabase endpoints:
- **`getUser`**: Validates an `access_token` from the `Authorization` header, retrieves the session from the database, and returns the user data.
- **`signInWithOtp`**: Simulates sending an OTP for email/phone login.
- **`verifyOtp`**: Verifies an OTP and creates/stores a session.
- **`exchangeCodeForSession`**: Handles OAuth flows by generating a session.
- **`logout`**: Simulates logout by invalidating a session.

### 3. Usage in Tests

#### Setting Up Authentication
```typescript
import { createMockSupabaseSession } from '~/path/to/your-utils';
import { setMockSession } from '~/path/to/mock-sessions';

// Create a mock session
const mockSession = createMockSupabaseSession({ user: someUser });
await setMockSession(mockSession.access_token, mockSession);

// Set the auth cookie for the Supabase client
const cookieName = `sb-${projectReference}-auth-token`;
const cookieValue = JSON.stringify(mockSession);
const request = new Request(url, {
  headers: { Cookie: `${cookieName}=${cookieValue}` },
});
```

#### Playwright Integration

Utilities in `playwright/utils.ts` leverage this system:

- **`loginByCookie`**: Injects the session cookie into a Playwright page.
- **`createAuthenticatedRequest`**: Builds an authenticated request context for API testing.

### 4. Test Environment Setup

Automatic cleanup is configured in:

- **`setup-server-test-environment.ts`**: Clears mock sessions after server-side tests.
- **`global-tear-down.ts`**: Resets the database after Playwright test suites.

## Best Practices

1. **Session Cleanup**
   - Always call `clearMockSessions` in test teardown to prevent session leakage between tests.
   - Example: `afterAll(async () => { await clearMockSessions(); });`

2. **Access Token Management**
   - Use `createMockSupabaseSession` to generate sessions with unique `access_token`s.
   - Avoid manually crafting tokens to ensure compatibility with the mock handlers.

3. **Cross-Environment Testing**
   - Rely on the database for session state; don’t assume in-memory persistence.
   - Test scenarios across Playwright and unit tests to verify shared state works.

## Further Reading

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth): Understand real Supabase behavior.
- [MSW Documentation](https://mswjs.io/docs/): Learn more about mock service workers.
- [Playwright Testing Guide](https://playwright.dev/docs/intro): Integrate with browser tests.
- [Prisma Documentation](https://www.prisma.io/docs/): Details on database operations.
