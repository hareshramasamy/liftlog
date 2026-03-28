import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getExercisesCatalog } from '@/data/exercises';
import NewWorkoutForm from './NewWorkoutForm';

export default async function NewWorkoutPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const exercises = await getExercisesCatalog();

  return (
    <div className="mx-auto w-[55%] py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Log workout
      </h1>
      <NewWorkoutForm exercises={exercises} />
    </div>
  );
}
