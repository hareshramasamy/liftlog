# Data Mutations

## CRITICAL: Server Actions Only

ALL data mutations in this app MUST be done via **Server Actions**. This is non-negotiable.

- **DO NOT** mutate data via Route Handlers (`app/api/`)
- **DO NOT** call Drizzle ORM directly from Server Actions — always go through a `/data` helper
- **DO NOT** use `FormData` as a parameter type in any Server Action
- **DO NOT** skip validation — every Server Action MUST validate its arguments with Zod before touching the database

## Database Mutations: `/data` Directory

All database write operations (insert, update, delete) MUST live in helper functions inside the `src/data` directory — the same directory as read helpers. Server Actions call these helpers; they never call Drizzle directly.

### Rules

- **Use Drizzle ORM exclusively.** Raw SQL is forbidden.
- **Every mutation helper MUST accept `userId` as an explicit parameter** and apply it as a `.where()` filter on any update or delete to prevent one user from modifying another user's records.
- Mutation helpers are plain `async` functions — they have no `"use server"` directive. That belongs in `actions.ts`.

### Neon HTTP driver limitation: no transactions

The database client (`src/db/index.ts`) uses `drizzle-orm/neon-http`, which does **not** support interactive transactions. Calling `db.transaction()` will throw at runtime:

```
No transactions support in neon-http driver
```

For multi-table writes, use sequential `await db.insert()` / `await db.update()` / `await db.delete()` calls instead. Rely on foreign key `ON DELETE CASCADE` constraints (already defined in the schema) to maintain referential integrity.

```ts
// WRONG — transactions are not supported with neon-http
await db.transaction(async (tx) => {
  await tx.insert(workouts).values(...);
  await tx.insert(workoutExercises).values(...);
});

// CORRECT — sequential inserts
const [workout] = await db.insert(workouts).values(...).returning();
const [workoutExercise] = await db.insert(workoutExercises).values({ workoutId: workout.id, ... }).returning();
await db.insert(sets).values(...);
```

### Example

```ts
// src/data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function createWorkout(userId: string, name: string, date: string) {
  return db.insert(workouts).values({ userId, name, date }).returning();
}

export async function deleteWorkout(userId: string, workoutId: string) {
  return db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}
```

## Server Actions: `actions.ts`

Server Actions MUST live in a file named `actions.ts` colocated with the route or component that uses them.

```
app/
  dashboard/
    page.tsx
    actions.ts   ← Server Actions for the dashboard route
  workouts/
    [id]/
      page.tsx
      actions.ts ← Server Actions for the workout detail route
```

### Rules

- Every `actions.ts` file MUST have `"use server"` at the top.
- **Parameters MUST be explicitly typed.** Never use `FormData` as a parameter type.
- **Every Server Action MUST validate its arguments with Zod** before calling any `/data` helper or performing any side effect.
- Retrieve the authenticated `userId` inside the action (via `auth()`) and pass it explicitly to the `/data` helper — never accept `userId` as a caller-supplied parameter.
- Return a typed result object (e.g. `{ success: true, data }` or `{ success: false, error: string }`) so the caller can handle errors without relying on thrown exceptions.

### Example

```ts
// app/workouts/actions.ts
"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createWorkout } from "@/data/workouts";

const CreateWorkoutSchema = z.object({
  name: z.string().min(1).max(100),
  date: z.string().date(),
});

export async function createWorkoutAction(params: {
  name: string;
  date: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthenticated" } as const;
  }

  const parsed = CreateWorkoutSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten() } as const;
  }

  const [workout] = await createWorkout(
    session.user.id,
    parsed.data.name,
    parsed.data.date,
  );

  return { success: true, data: workout } as const;
}
```

### Never do this

```ts
// WRONG — FormData param
export async function createWorkoutAction(formData: FormData) { ... }

// WRONG — no Zod validation
export async function createWorkoutAction(params: { name: string; date: string }) {
  await createWorkout(params.name, params.date); // unsanitized input
}

// WRONG — Drizzle called directly in the action
export async function deleteWorkoutAction(id: string) {
  await db.delete(workouts).where(eq(workouts.id, id)); // bypasses /data layer
}

// WRONG — userId accepted from caller
export async function updateWorkoutAction(userId: string, name: string) { ... }
```
