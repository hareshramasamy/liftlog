import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { getWorkoutById } from '@/data/workouts';
import { getExercisesCatalog } from '@/data/exercises';
import EditWorkoutForm from './EditWorkoutForm';

type Props = {
  params: Promise<{ workoutId: string }>;
};

export default async function EditWorkoutPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { workoutId } = await params;

  const [workout, allExercises] = await Promise.all([
    getWorkoutById(userId, workoutId),
    getExercisesCatalog(),
  ]);

  if (!workout) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Edit workout
      </h1>
      <EditWorkoutForm
        workoutId={workout.id}
        initialName={workout.name ?? ''}
        initialExercises={workout.exercises}
        allExercises={allExercises}
      />
    </div>
  );
}
