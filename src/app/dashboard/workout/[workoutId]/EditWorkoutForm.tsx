'use client';

import { useState, useTransition } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateWorkoutAction } from './actions';

type Exercise = {
  id: string;
  name: string;
};

type SetRow = {
  reps: string;
  weightKg: string;
};

type ExerciseEntry = {
  exerciseId: string;
  sets: SetRow[];
};

type ExistingExercise = {
  exerciseId: string;
  name: string;
  sets: { reps: number | null; weightKg: string | null }[];
};

type Props = {
  workoutId: string;
  initialName: string;
  initialExercises: ExistingExercise[];
  allExercises: Exercise[];
};

export default function EditWorkoutForm({
  workoutId,
  initialName,
  initialExercises,
  allExercises,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [workoutName, setWorkoutName] = useState(initialName);
  const [entries, setEntries] = useState<ExerciseEntry[]>(() =>
    initialExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.map((s) => ({
        reps: s.reps?.toString() ?? '',
        weightKg: s.weightKg ?? '',
      })),
    })),
  );
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [error, setError] = useState<string | null>(null);

  function addExercise() {
    if (!selectedExerciseId) return;
    setEntries((prev) => [
      ...prev,
      { exerciseId: selectedExerciseId, sets: [{ reps: '', weightKg: '' }] },
    ]);
    setSelectedExerciseId('');
  }

  function removeExercise(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  }

  function addSet(exerciseIndex: number) {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === exerciseIndex
          ? { ...entry, sets: [...entry.sets, { reps: '', weightKg: '' }] }
          : entry,
      ),
    );
  }

  function removeSet(exerciseIndex: number, setIndex: number) {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === exerciseIndex
          ? { ...entry, sets: entry.sets.filter((_, si) => si !== setIndex) }
          : entry,
      ),
    );
  }

  function updateSet(exerciseIndex: number, setIndex: number, field: keyof SetRow, value: string) {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === exerciseIndex
          ? {
              ...entry,
              sets: entry.sets.map((s, si) =>
                si === setIndex ? { ...s, [field]: value } : s,
              ),
            }
          : entry,
      ),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateWorkoutAction({
        workoutId,
        name: workoutName,
        exercises: entries.map((entry, i) => ({
          exerciseId: entry.exerciseId,
          order: i,
          sets: entry.sets.map((s, si) => ({
            setNumber: si + 1,
            reps: Number(s.reps),
            weightKg: s.weightKg,
          })),
        })),
      });

      if (result && !result.success) {
        setError(result.error);
      }
    });
  }

  const exerciseName = (id: string) => allExercises.find((e) => e.id === id)?.name ?? '';
  const availableExercises = allExercises.filter(
    (e) => !entries.some((entry) => entry.exerciseId === e.id),
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Workout name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="workout-name">Workout name</Label>
        <Input
          id="workout-name"
          placeholder="e.g. Push Day"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          required
        />
      </div>

      {/* Exercises */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-6">
          {entries.map((entry, exerciseIndex) => (
            <div
              key={`${entry.exerciseId}-${exerciseIndex}`}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {exerciseName(entry.exerciseId)}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExercise(exerciseIndex)}
                  aria-label="Remove exercise"
                >
                  <Trash2Icon className="h-4 w-4 text-zinc-500" />
                </Button>
              </div>

              {/* Sets */}
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  <span>Set</span>
                  <span>Reps</span>
                  <span>Weight (kg)</span>
                  <span />
                </div>

                {entry.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2"
                  >
                    <span className="text-sm text-zinc-500">{setIndex + 1}</span>
                    <Input
                      type="number"
                      min={1}
                      placeholder="8"
                      value={set.reps}
                      onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value)}
                      required
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.25"
                      placeholder="60"
                      value={set.weightKg}
                      onChange={(e) => updateSet(exerciseIndex, setIndex, 'weightKg', e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSet(exerciseIndex, setIndex)}
                      disabled={entry.sets.length === 1}
                      aria-label="Remove set"
                    >
                      <Trash2Icon className="h-3.5 w-3.5 text-zinc-400" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 gap-1.5 text-zinc-600 dark:text-zinc-400"
                onClick={() => addSet(exerciseIndex)}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add set
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add exercise */}
      {availableExercises.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select an exercise" />
            </SelectTrigger>
            <SelectContent>
              {availableExercises.map((exercise) => (
                <SelectItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={addExercise}
            disabled={!selectedExerciseId}
          >
            <PlusIcon className="h-4 w-4" />
            Add exercise
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button type="submit" disabled={isPending || entries.length === 0}>
        {isPending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  );
}
