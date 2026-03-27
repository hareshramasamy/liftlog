import { db } from '@/db';
import { exercisesCatalog, sets, workoutExercises, workouts } from '@/db/schema';
import { and, eq, gte, lt } from 'drizzle-orm';

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
