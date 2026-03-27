# Data Fetching

## CRITICAL: Server Components Only

ALL data fetching in this app MUST be done via **Server Components**. This is non-negotiable.

- **DO NOT** fetch data in Client Components (`"use client"`)
- **DO NOT** fetch data via Route Handlers (`app/api/`)
- **DO NOT** use `useEffect` + `fetch` or any client-side data fetching pattern
- **DO NOT** use SWR, React Query, or any client-side fetching library

Data flows one way: server component calls a helper function in `/data`, which queries the database, and passes the result down as props to any client components that need it.

## Database Queries: `/data` Directory

All database queries MUST live in helper functions inside the `/data` directory. These functions are the only place database access is allowed.

### Rules

- **Use Drizzle ORM exclusively.** Raw SQL is forbidden — no `db.execute(sql\`...\`)`, no `db.run(...)`, no template literal SQL strings.
- **Every helper function that returns user data MUST scope the query to the authenticated user's ID.** A logged-in user must only ever be able to access their own data. There must be no code path through which a user can read or modify another user's records.
- Helper functions must accept the authenticated `userId` as an explicit parameter and apply it as a `.where()` filter in every query.

### Example

```ts
// data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

// userId is always passed explicitly — never inferred from a global or request context inside the helper
export async function getWorkoutsForUser(userId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId));
}
```

```ts
// app/dashboard/page.tsx  ← Server Component
import { auth } from "@/auth";
import { getWorkoutsForUser } from "@/data/workouts";

export default async function DashboardPage() {
  const session = await auth();
  const workouts = await getWorkoutsForUser(session.user.id);

  return <WorkoutList workouts={workouts} />;
}
```

### Never do this

```ts
// WRONG — raw SQL
const result = await db.execute(sql`SELECT * FROM workouts WHERE user_id = ${userId}`);

// WRONG — no user scoping
export async function getAllWorkouts() {
  return db.select().from(workouts); // exposes every user's data
}

// WRONG — data fetching in a client component
"use client";
useEffect(() => {
  fetch("/api/workouts").then(...);
}, []);
```
