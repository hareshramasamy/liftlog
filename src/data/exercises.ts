import { db } from '@/db';
import { exercisesCatalog } from '@/db/schema';
import { asc } from 'drizzle-orm';

export async function getExercisesCatalog() {
  return db
    .select({ id: exercisesCatalog.id, name: exercisesCatalog.name })
    .from(exercisesCatalog)
    .orderBy(asc(exercisesCatalog.name));
}
