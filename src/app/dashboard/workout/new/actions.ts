'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createWorkoutWithExercisesAndSets } from '@/data/workouts';
import { format } from 'date-fns';

const SetSchema = z.object({
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z
    .string()
    .refine((val) => val !== '' && !isNaN(Number(val)) && Number(val) >= 0, {
      message: 'Weight must be a valid non-negative number',
    }),
});

const ExerciseSchema = z.object({
  exerciseId: z.string().min(1),
  order: z.number().int().nonnegative(),
  sets: z.array(SetSchema).min(1, 'Each exercise must have at least one set'),
});

const CreateWorkoutSchema = z.object({
  name: z.string().min(1, 'Workout name is required').max(255),
  exercises: z.array(ExerciseSchema).min(1, 'At least one exercise is required'),
});

export type CreateWorkoutParams = z.input<typeof CreateWorkoutSchema>;
export type CreateWorkoutResult =
  | { success: true }
  | { success: false; error: string };

export async function createWorkoutAction(
  params: CreateWorkoutParams,
): Promise<CreateWorkoutResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthenticated' };
  }

  const parsed = CreateWorkoutSchema.safeParse(params);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: message || 'Invalid input' };
  }

  await createWorkoutWithExercisesAndSets(
    userId,
    parsed.data.name,
    parsed.data.exercises,
  );

  redirect(`/dashboard?date=${format(new Date(), 'yyyy-MM-dd')}`);
}
