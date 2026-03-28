import { db } from '@/db';
import { exercisesCatalog, sets, workoutExercises, workouts } from '@/db/schema';
import { and, asc, eq, gte, lt, max } from 'drizzle-orm';

type NewSet = {
  setNumber: number;
  reps: number;
  weightKg: string;
};

type NewExercise = {
  exerciseId: string;
  order: number;
  sets: NewSet[];
};

export async function createWorkoutWithExercisesAndSets(
  userId: string,
  name: string,
  exercises: NewExercise[],
) {
  const [workout] = await db
    .insert(workouts)
    .values({ userId, name })
    .returning();

  for (const exercise of exercises) {
    const [workoutExercise] = await db
      .insert(workoutExercises)
      .values({
        workoutId: workout.id,
        exerciseId: exercise.exerciseId,
        order: exercise.order,
      })
      .returning();

    if (exercise.sets.length > 0) {
      await db.insert(sets).values(
        exercise.sets.map((s) => ({
          workoutExerciseId: workoutExercise.id,
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
        })),
      );
    }
  }

  return workout;
}

export async function getWorkoutById(userId: string, workoutId: string) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));

  if (!workout) return null;

  const rows = await db
    .select({
      workoutExerciseId: workoutExercises.id,
      workoutExerciseOrder: workoutExercises.order,
      exerciseId: exercisesCatalog.id,
      exerciseName: exercisesCatalog.name,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightKg: sets.weightKg,
    })
    .from(workoutExercises)
    .innerJoin(exercisesCatalog, eq(exercisesCatalog.id, workoutExercises.exerciseId))
    .innerJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.order), asc(sets.setNumber));

  const exerciseMap = new Map<
    string,
    { id: string; exerciseId: string; name: string; sets: { setNumber: number; reps: number | null; weightKg: string | null }[] }
  >();

  for (const row of rows) {
    if (!exerciseMap.has(row.workoutExerciseId)) {
      exerciseMap.set(row.workoutExerciseId, {
        id: row.workoutExerciseId,
        exerciseId: row.exerciseId,
        name: row.exerciseName,
        sets: [],
      });
    }
    exerciseMap.get(row.workoutExerciseId)!.sets.push({
      setNumber: row.setNumber,
      reps: row.reps,
      weightKg: row.weightKg,
    });
  }

  return {
    ...workout,
    exercises: Array.from(exerciseMap.values()),
  };
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  name: string,
  exercises: NewExercise[],
) {
  // Verify ownership and update name
  await db
    .update(workouts)
    .set({ name, updatedAt: new Date() })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));

  // Delete existing exercises — cascades to sets via ON DELETE CASCADE
  await db.delete(workoutExercises).where(eq(workoutExercises.workoutId, workoutId));

  // Re-insert exercises and sets
  for (const exercise of exercises) {
    const [workoutExercise] = await db
      .insert(workoutExercises)
      .values({
        workoutId,
        exerciseId: exercise.exerciseId,
        order: exercise.order,
      })
      .returning();

    if (exercise.sets.length > 0) {
      await db.insert(sets).values(
        exercise.sets.map((s) => ({
          workoutExerciseId: workoutExercise.id,
          setNumber: s.setNumber,
          reps: s.reps,
          weightKg: s.weightKg,
        })),
      );
    }
  }
}

export async function getWorkoutSummariesByDate(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db
    .select({ id: workouts.id, name: workouts.name, createdAt: workouts.createdAt })
    .from(workouts)
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.createdAt, startOfDay),
        lt(workouts.createdAt, endOfDay),
      ),
    );
}

export async function deleteWorkout(userId: string, workoutId: string) {
  await db
    .delete(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));
}

export async function removeExerciseFromWorkout(userId: string, workoutExerciseId: string) {
  // Verify ownership via join before deleting
  const [row] = await db
    .select({ workoutExerciseId: workoutExercises.id })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(workoutExercises.id, workoutExerciseId), eq(workouts.userId, userId)));

  if (!row) return;

  await db.delete(workoutExercises).where(eq(workoutExercises.id, workoutExerciseId));
}

export async function updateExerciseSets(
  userId: string,
  workoutExerciseId: string,
  newSets: NewSet[],
) {
  // Verify ownership
  const [row] = await db
    .select({ workoutExerciseId: workoutExercises.id })
    .from(workoutExercises)
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(workoutExercises.id, workoutExerciseId), eq(workouts.userId, userId)));

  if (!row) return;

  await db.delete(sets).where(eq(sets.workoutExerciseId, workoutExerciseId));

  if (newSets.length > 0) {
    await db.insert(sets).values(
      newSets.map((s) => ({
        workoutExerciseId,
        setNumber: s.setNumber,
        reps: s.reps,
        weightKg: s.weightKg,
      })),
    );
  }
}

export async function addExerciseToWorkout(
  userId: string,
  workoutId: string,
  exercise: { exerciseId: string; sets: NewSet[] },
) {
  // Verify ownership
  const [workout] = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)));

  if (!workout) return;

  // Get current max order
  const [{ maxOrder }] = await db
    .select({ maxOrder: max(workoutExercises.order) })
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId));

  const nextOrder = (maxOrder ?? -1) + 1;

  const [workoutExercise] = await db
    .insert(workoutExercises)
    .values({ workoutId, exerciseId: exercise.exerciseId, order: nextOrder })
    .returning();

  if (exercise.sets.length > 0) {
    await db.insert(sets).values(
      exercise.sets.map((s) => ({
        workoutExerciseId: workoutExercise.id,
        setNumber: s.setNumber,
        reps: s.reps,
        weightKg: s.weightKg,
      })),
    );
  }
}

export async function getWorkoutsForUserByDate(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const rows = await db
    .select({
      workoutId: workouts.id,
      workoutName: workouts.name,
      workoutExerciseId: workoutExercises.id,
      workoutExerciseOrder: workoutExercises.order,
      exerciseName: exercisesCatalog.name,
      setNumber: sets.setNumber,
      reps: sets.reps,
      weightKg: sets.weightKg,
    })
    .from(workouts)
    .innerJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
    .innerJoin(exercisesCatalog, eq(exercisesCatalog.id, workoutExercises.exerciseId))
    .innerJoin(sets, eq(sets.workoutExerciseId, workoutExercises.id))
    .where(
      and(
        eq(workouts.userId, userId),
        gte(workouts.createdAt, startOfDay),
        lt(workouts.createdAt, endOfDay),
      ),
    )
    .orderBy(workoutExercises.order, sets.setNumber);

  // Shape flat rows into nested workout → exercise → sets structure
  const workoutMap = new Map<
    string,
    {
      id: string;
      name: string | null;
      exercises: Map<string, { id: string; name: string; sets: { setNumber: number; reps: number | null; weightKg: string | null }[] }>;
    }
  >();

  for (const row of rows) {
    if (!workoutMap.has(row.workoutId)) {
      workoutMap.set(row.workoutId, {
        id: row.workoutId,
        name: row.workoutName,
        exercises: new Map(),
      });
    }

    const workout = workoutMap.get(row.workoutId)!;

    if (!workout.exercises.has(row.workoutExerciseId)) {
      workout.exercises.set(row.workoutExerciseId, {
        id: row.workoutExerciseId,
        name: row.exerciseName,
        sets: [],
      });
    }

    workout.exercises.get(row.workoutExerciseId)!.sets.push({
      setNumber: row.setNumber,
      reps: row.reps,
      weightKg: row.weightKg,
    });
  }

  return Array.from(workoutMap.values()).map((w) => ({
    ...w,
    exercises: Array.from(w.exercises.values()),
  }));
}
