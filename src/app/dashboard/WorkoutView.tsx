'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon, ChevronRightIcon, ClockIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';

type Workout = {
  id: string;
  name: string | null;
  createdAt: Date;
};

type Props = {
  workouts: Workout[];
  selectedDate: Date;
};

export default function WorkoutView({ workouts, selectedDate }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    setOpen(false);
    router.replace(`/dashboard?date=${format(date, 'yyyy-MM-dd')}`);
  }

  return (
    <div className="mx-auto w-[55%] py-12">
      {/* Page heading */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Workout Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Track and review your training sessions.
        </p>
      </div>

      {/* Date row */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Workouts for{' '}
          <span className="text-zinc-900 dark:text-zinc-50">
            {format(selectedDate, 'do MMM yyyy')}
          </span>
        </h2>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/workout/new">
            <Button className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Log Workout
            </Button>
          </Link>

          <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, 'do MMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            No workouts logged for this date.
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
            Log a workout to see it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/dashboard/workout/${workout.id}`}>
              <Card className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer">
                <CardContent className="flex items-center justify-between px-6 py-6">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                      {workout.name ?? 'Untitled workout'}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                      <ClockIcon className="h-3.5 w-3.5" />
                      Logged at {format(workout.createdAt, 'h:mm a')}
                    </span>
                  </div>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
