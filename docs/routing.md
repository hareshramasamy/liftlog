# Routing Standards

## Route Structure

All application routes must be nested under `/dashboard`.

- The root `/` page may exist as a landing or redirect page only.
- All authenticated app functionality lives under `/dashboard` and its sub-routes (e.g. `/dashboard/workout/[workoutId]`).

## Route Protection

All `/dashboard` routes must be protected so that only authenticated users can access them.

**Protection is handled exclusively via Next.js middleware** (`src/middleware.ts`). Do not implement route protection inside individual page components or layouts.

Use Clerk's middleware helpers to protect routes:

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

- Do NOT use `auth().protect()` or redirect logic inside `page.tsx` or `layout.tsx` for route guarding.
- The middleware is the single source of truth for access control.
