import { z } from 'zod';

/** Calendar dates (no time, no zone) travel as `YYYY-MM-DD` and are stored in `DATE` columns. */
export const dateOnlySchema = z.iso.date();

/** Midnight UTC so the `DATE` column receives exactly the calendar day given, whatever the server zone. */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
