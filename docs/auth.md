# Authentication

## Provider: Clerk

This app uses **Clerk** exclusively for authentication. Do not introduce any other auth library or custom auth implementation.

- `@clerk/nextjs` is the only auth package used
- `ClerkProvider` wraps the entire app in `src/app/layout.tsx`
- Route protection is handled by `clerkMiddleware` in `src/middleware.ts`

## Getting the current user

**In Server Components and server-side code**, use Clerk's `auth()` helper from `@clerk/nextjs/server`:

```ts
import { auth } from '@clerk/nextjs/server';

const { userId } = await auth();
```

- Always check that `userId` is non-null. If it is null, the user is not signed in — redirect them:

```ts
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const { userId } = await auth();
if (!userId) redirect('/sign-in');
```

- Never use `currentUser()` when only the `userId` is needed — `auth()` is lighter and sufficient for data fetching and access control.

## UI components

Use Clerk's built-in components for all sign-in/sign-up/user UI. Do not build custom auth forms.

| Component | Purpose |
|---|---|
| `<SignInButton>` | Trigger sign-in (use `mode="modal"`) |
| `<SignUpButton>` | Trigger sign-up (use `mode="modal"`) |
| `<UserButton>` | Signed-in user avatar + account menu |
| `<Show when="signed-in">` | Conditionally render for signed-in users |
| `<Show when="signed-out">` | Conditionally render for signed-out users |

## Route protection

All routes are passed through `clerkMiddleware` (see `src/middleware.ts`). To make a route require authentication, redirect from the server component itself using the `auth()` + `redirect()` pattern shown above — this is the preferred approach over configuring route matchers.

## What NOT to do

- Do **not** use `getAuth()`, `withAuth()`, or any other auth helper — use `auth()` from `@clerk/nextjs/server` exclusively
- Do **not** store the `userId` in local state, cookies, or any custom session — always read it fresh from `auth()`
- Do **not** build custom sign-in/sign-up pages or forms — use Clerk's modal components
- Do **not** pass `userId` from a client component — resolve it on the server and pass data down as props
