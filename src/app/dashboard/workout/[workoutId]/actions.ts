'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  deleteWorkout,
  removeExerciseFromWorkout,
  updateExerciseSets,
  addExerciseToWorkout,
} from '@/data/workouts';

const SetSchema = z.object({
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z
    .string()
    .refine((val) => val !== '' && !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Weight must be a valid non-negative number',
    }),
});

export type ActionResult = { success: true } | { success: false; error: string };

export async function deleteWorkoutAction(workoutId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  await deleteWorkout(userId, workoutId);
  redirect(`/dashboard?date=${format(new Date(), 'yyyy-MM-dd')}`);
}

export async function removeExerciseAction(
  workoutId: string,
  workoutExerciseId: string,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthenticated' };

  await removeExerciseFromWorkout(userId, workoutExerciseId);
  revalidatePath(`/dashboard/workout/${workoutId}`);
  return { success: true };
}

const UpdateSetsSchema = z.object({
  workoutExerciseId: z.string().min(1),
  sets: z.array(SetSchema).min(1, 'At least one set is required'),
});

export async function updateExerciseSetsAction(
  params: z.input<typeof UpdateSetsSchema>,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthenticated' };

  const parsed = UpdateSetsSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  await updateExerciseSets(userId, parsed.data.workoutExerciseId, parsed.data.sets);
  revalidatePath(`/dashboard/workout`);
  return { success: true };
}

const AddExerciseSchema = z.object({
  workoutId: z.string().min(1),
  exerciseId: z.string().min(1),
  sets: z.array(SetSchema).min(1, 'At least one set is required'),
});

export async function addExerciseAction(
  params: z.input<typeof AddExerciseSchema>,
): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthenticated' };

  const parsed = AddExerciseSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  await addExerciseToWorkout(userId, parsed.data.workoutId, {
    exerciseId: parsed.data.exerciseId,
    sets: parsed.data.sets,
  });

  revalidatePath(`/dashboard/workout/${parsed.data.workoutId}`);
  return { success: true };
}
