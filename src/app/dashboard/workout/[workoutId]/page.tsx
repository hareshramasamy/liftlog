import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { getWorkoutById } from '@/data/workouts';
import { getExercisesCatalog } from '@/data/exercises';
import WorkoutDetail from './WorkoutDetail';

type Props = {
  params: Promise<{ workoutId: string }>;
};

export default async function WorkoutPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const { workoutId } = await params;

  const [workout, allExercises] = await Promise.all([
    getWorkoutById(userId, workoutId),
    getExercisesCatalog(),
  ]);

  if (!workout) notFound();

  return (
    <div className="mx-auto w-[55%] py-10">
      <WorkoutDetail
        workoutId={workout.id}
        workoutName={workout.name ?? 'Untitled workout'}
        exercises={workout.exercises}
        allExercises={allExercises}
      />
    </div>
  );
}
