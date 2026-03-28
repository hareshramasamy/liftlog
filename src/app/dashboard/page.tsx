import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getWorkoutSummariesByDate } from '@/data/workouts';
import WorkoutView from './WorkoutView';

type Props = {
  searchParams: Promise<{ date?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const { date: dateParam } = await searchParams;

  function parseDateParam(param: string): Date {
    const [year, month, day] = param.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const selectedDate = dateParam ? parseDateParam(dateParam) : new Date();

  const workouts = await getWorkoutSummariesByDate(userId, selectedDate);

  return <WorkoutView workouts={workouts} selectedDate={selectedDate} />;
}
