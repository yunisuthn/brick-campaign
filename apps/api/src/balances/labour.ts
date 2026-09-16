/**
 * Reference document, section 4, "tarif à fixer": a rate is null until negotiated. An amount
 * that needs a missing rate for a non-zero quantity is unknown (null), never 0; nothing to pay
 * for depends on no rate.
 */
export function labourCost(quantity: number, rate: number | null): number | null {
  if (quantity === 0) return 0;
  return rate === null ? null : quantity * rate;
}

/** A sum with one unknown part is unknown. */
export function sumKnown(parts: ReadonlyArray<number | null>): number | null {
  let total = 0;
  for (const part of parts) {
    if (part === null) return null;
    total += part;
  }
  return total;
}
