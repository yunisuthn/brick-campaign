import { z } from 'zod';

/** Route `:id` params: a malformed id is a 400, not a 404 or a database round-trip. */
export const uuidSchema = z.uuid();
