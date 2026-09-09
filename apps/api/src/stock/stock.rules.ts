export interface StockCounts {
  /** Live production entries. */
  produced: number;
  /** Live kiln batches, unloaded or not. */
  loaded: number;
  /** Live kiln batches with an unloading date. */
  unloaded: number;
  /** Live deliveries. Zero until deliveries exist (reference document, section 7, step 5). */
  delivered: number;
}

export interface StockLevels {
  raw: number;
  inKiln: number;
  fired: number;
}

/**
 * Reference document, section 4: raw = produced - loaded; fired = unloaded - delivered.
 * Breakage is not counted (section 1): what goes into the kiln comes out of it.
 */
export function stockLevels(counts: StockCounts): StockLevels {
  return {
    raw: counts.produced - counts.loaded,
    inKiln: counts.loaded - counts.unloaded,
    fired: counts.unloaded - counts.delivered,
  };
}
