'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  deleteWorkoutAction,
  removeExerciseAction,
  updateExerciseSetsAction,
  addExerciseAction,
} from './actions';

type SetRow = {
  setNumber: number;
  reps: number | null;
  weightKg: string | null;
};

type Exercise = {
  id: string;
  exerciseId: string;
  name: string;
  sets: SetRow[];
};

type CatalogExercise = {
  id: string;
  name: string;
};

type Props = {
  workoutId: string;
  workoutName: string;
  exercises: Exercise[];
  allExercises: CatalogExercise[];
};

type EditingSet = { reps: string; weightKg: string };

export default function WorkoutDetail({ workoutId, workoutName, exercises, allExercises }: Props) {
  const router = useRouter();
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingSets, setEditingSets] = useState<EditingSet[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // Add exercise state
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [addSets, setAddSets] = useState<EditingSet[]>([{ reps: '', weightKg: '' }]);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const usedExerciseIds = new Set(exercises.map((e) => e.exerciseId));
  const availableExercises = allExercises.filter((e) => !usedExerciseIds.has(e.id));

  function startEditing(exercise: Exercise) {
    setEditingExerciseId(exercise.id);
    setEditingSets(
      exercise.sets.map((s) => ({
        reps: s.reps?.toString() ?? '',
        weightKg: s.weightKg ?? '',
      })),
    );
    setSaveError(null);
  }

  function cancelEditing() {
    setEditingExerciseId(null);
    setEditingSets([]);
    setSaveError(null);
  }

  function updateEditingSet(index: number, field: keyof EditingSet, value: string) {
    setEditingSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addEditingSet() {
    setEditingSets((prev) => [...prev, { reps: '', weightKg: '' }]);
  }

  function removeEditingSet(index: number) {
    setEditingSets((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveExercise(workoutExerciseId: string) {
    setIsSaving(true);
    setSaveError(null);
    const result = await updateExerciseSetsAction({
      workoutExerciseId,
      sets: editingSets.map((s, i) => ({
        setNumber: i + 1,
        reps: Number(s.reps),
        weightKg: s.weightKg,
      })),
    });
    setIsSaving(false);
    if (result.success) {
      setEditingExerciseId(null);
      router.refresh();
    } else {
      setSaveError(result.error);
    }
  }

  async function removeExercise(workoutExerciseId: string) {
    setRemovingIds((prev) => new Set(prev).add(workoutExerciseId));
    await removeExerciseAction(workoutId, workoutExerciseId);
    router.refresh();
  }

  function handleDeleteWorkout() {
    startDeleteTransition(async () => {
      await deleteWorkoutAction(workoutId);
    });
  }

  function updateAddSet(index: number, field: keyof EditingSet, value: string) {
    setAddSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  async function handleAddExercise() {
    if (!selectedExerciseId) return;
    setIsAdding(true);
    setAddError(null);
    const result = await addExerciseAction({
      workoutId,
      exerciseId: selectedExerciseId,
      sets: addSets.map((s, i) => ({
        setNumber: i + 1,
        reps: Number(s.reps),
        weightKg: s.weightKg,
      })),
    });
    setIsAdding(false);
    if (result.success) {
      setShowAddForm(false);
      setSelectedExerciseId('');
      setAddSets([{ reps: '', weightKg: '' }]);
      router.refresh();
    } else {
      setAddError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {workoutName}
        </h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteWorkout}
          disabled={isPendingDelete}
        >
          <Trash2Icon className="h-4 w-4 mr-1.5" />
          {isPendingDelete ? 'Deleting…' : 'Delete workout'}
        </Button>
      </div>

      {/* Exercises */}
      {exercises.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No exercises logged yet.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {exercises.map((exercise) => {
            const isEditing = editingExerciseId === exercise.id;
            const isRemoving = removingIds.has(exercise.id);

            return (
              <Card key={exercise.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{exercise.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => saveExercise(exercise.id)}
                            disabled={isSaving || editingSets.length === 0}
                            aria-label="Save"
                          >
                            <CheckIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={cancelEditing}
                            disabled={isSaving}
                            aria-label="Cancel"
                          >
                            <XIcon className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(exercise)}
                            disabled={isRemoving}
                            aria-label="Edit exercise"
                          >
                            <PencilIcon className="h-4 w-4 text-zinc-500" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExercise(exercise.id)}
                            disabled={isRemoving}
                            aria-label="Remove exercise"
                          >
                            <Trash2Icon className="h-4 w-4 text-zinc-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Shared column header */}
                  <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 pb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    <span>Set</span>
                    <span>Reps</span>
                    <span>Weight (kg)</span>
                    <span />
                  </div>

                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      {editingSets.map((set, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2"
                        >
                          <span className="text-sm text-zinc-500">{i + 1}</span>
                          <Input
                            type="number"
                            min={1}
                            placeholder="8"
                            value={set.reps}
                            onChange={(e) => updateEditingSet(i, 'reps', e.target.value)}
                          />
                          <Input
                            type="number"
                            min={0}
                            step="0.25"
                            placeholder="60"
                            value={set.weightKg}
                            onChange={(e) => updateEditingSet(i, 'weightKg', e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEditingSet(i)}
                            disabled={editingSets.length === 1}
                            aria-label="Remove set"
                          >
                            <Trash2Icon className="h-3.5 w-3.5 text-zinc-400" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-1 gap-1.5 self-start text-zinc-600 dark:text-zinc-400"
                        onClick={addEditingSet}
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                        Add set
                      </Button>
                      {saveError && (
                        <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {exercise.sets.map((set) => (
                        <div
                          key={set.setNumber}
                          className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2"
                        >
                          <span className="text-sm text-zinc-500">{set.setNumber}</span>
                          <span className="flex h-9 items-center rounded-md border border-transparent px-3 text-sm text-zinc-800 dark:text-zinc-200">
                            {set.reps ?? '—'}
                          </span>
                          <span className="flex h-9 items-center rounded-md border border-transparent px-3 text-sm text-zinc-800 dark:text-zinc-200">
                            {set.weightKg ?? '—'}
                          </span>
                          <span />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add exercise */}
      {availableExercises.length > 0 && (
        <div>
          {!showAddForm ? (
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Add exercise
            </Button>
          ) : (
            <Card>
              <CardContent className="pt-6 flex flex-col gap-4">
                <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger>
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

                {selectedExerciseId && (
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>Weight (kg)</span>
                      <span />
                    </div>
                    {addSets.map((set, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-[2rem_1fr_1fr_2rem] items-center gap-2"
                      >
                        <span className="text-sm text-zinc-500">{i + 1}</span>
                        <Input
                          type="number"
                          min={1}
                          placeholder="8"
                          value={set.reps}
                          onChange={(e) => updateAddSet(i, 'reps', e.target.value)}
                        />
                        <Input
                          type="number"
                          min={0}
                          step="0.25"
                          placeholder="60"
                          value={set.weightKg}
                          onChange={(e) => updateAddSet(i, 'weightKg', e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setAddSets((prev) => prev.filter((_, si) => si !== i))}
                          disabled={addSets.length === 1}
                          aria-label="Remove set"
                        >
                          <Trash2Icon className="h-3.5 w-3.5 text-zinc-400" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 self-start text-zinc-600 dark:text-zinc-400"
                      onClick={() => setAddSets((prev) => [...prev, { reps: '', weightKg: '' }])}
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      Add set
                    </Button>
                  </div>
                )}

                {addError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{addError}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddExercise}
                    disabled={isAdding || !selectedExerciseId}
                  >
                    {isAdding ? 'Adding…' : 'Add exercise'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setSelectedExerciseId('');
                      setAddSets([{ reps: '', weightKg: '' }]);
                      setAddError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
