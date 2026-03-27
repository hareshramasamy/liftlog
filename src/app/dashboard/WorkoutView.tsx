'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Set = {
  setNumber: number;
  reps: number | null;
  weightKg: string | null;
};

type Exercise = {
  id: string;
  name: string;
  sets: Set[];
};

type Workout = {
  id: string;
  name: string | null;
  exercises: Exercise[];
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>

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

      {workouts.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No workouts logged for this date.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader>
                <CardTitle>{workout.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {workout.exercises.map((exercise) => (
                  <div key={exercise.id}>
                    <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {exercise.name}
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
                          <th className="pb-1 pr-8 font-medium">Set</th>
                          <th className="pb-1 pr-8 font-medium">Reps</th>
                          <th className="pb-1 font-medium">Weight (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set) => (
                          <tr key={set.setNumber} className="text-zinc-800 dark:text-zinc-200">
                            <td className="py-0.5 pr-8">{set.setNumber}</td>
                            <td className="py-0.5 pr-8">{set.reps ?? '—'}</td>
                            <td className="py-0.5">{set.weightKg ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
