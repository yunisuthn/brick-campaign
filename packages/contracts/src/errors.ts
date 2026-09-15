/**
 * The refusals the API can answer with. Extracted here the day the front needed them (reference
 * document, section 9.2): the API throws by code, the front turns the code into a French
 * sentence, and because the front's table is typed `Record<ErrorCode, ...>`, a code added on one
 * side without a sentence on the other stops the build instead of reaching a screen.
 *
 * A code names one status, here and nowhere else, so the same refusal cannot arrive as a 400 on
 * one route and a 409 on another.
 */
export const errorStatuses = {
  // 400 — the request is understood but the entry it describes is refused.
  validation_failed: 400,
  campaign_dates_out_of_order: 400,
  batch_dates_out_of_order: 400,
  production_dates_out_of_order: 400,
  date_outside_campaign: 400,
  delivery_before_sale: 400,
  sale_payment_before_sale: 400,
  unknown_moulder: 400,
  unknown_rice_field: 400,
  unknown_moulding_rate: 400,
  unknown_transport_rate: 400,
  unknown_client: 400,
  unknown_kiln_batch: 400,
  moulder_inactive: 400,
  raw_stock_too_low: 400,
  fired_stock_too_low: 400,
  sale_overpaid: 400,

  // 401 — no session, or the wrong credentials.
  session_required: 401,
  invalid_credentials: 401,

  // 404 — nothing under that id.
  campaign_not_found: 404,
  moulder_not_found: 404,
  contractor_not_found: 404,
  rice_field_not_found: 404,
  client_not_found: 404,
  production_not_found: 404,
  payment_not_found: 404,
  kiln_batch_not_found: 404,
  contractor_work_not_found: 404,
  sale_not_found: 404,
  delivery_not_found: 404,
  sale_payment_not_found: 404,
  expense_not_found: 404,

  // 409 — the row exists and something else holds it.
  campaign_year_taken: 409,
  kiln_batch_has_works: 409,
  sale_has_deliveries: 409,
  sale_has_payments: 409,
} as const;

export type ErrorCode = keyof typeof errorStatuses;

/** Numbers and dates the French sentence needs: how many bricks are left, which year is taken. */
export type ErrorDetails = Record<string, string | number | null>;

/** What a DTO schema objected to, kept coarse: enough to say it in French, and no more. */
export type IssueKind = 'invalid_type' | 'too_small' | 'too_big' | 'invalid_format' | 'other';

export interface ValidationIssue {
  /** Dotted path of the field inside the body, empty when the whole body is at fault. */
  path: string;
  /** English, for the logs. The front builds its own sentence from the fields below. */
  message: string;
  kind: IssueKind;
  /** What the bound counts (`string`, `int`, …), or the type that was expected. */
  origin?: string;
  /** The bound that was crossed: a length for a string, a value for a number. */
  limit?: number;
  /** Whether the bound itself is allowed: `positive()` reports 0, exclusive. */
  inclusive?: boolean;
}

/** The body of any non-2xx answer. `issues` comes with `validation_failed` and nothing else. */
export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: ErrorDetails;
  issues?: ValidationIssue[];
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && value in errorStatuses;
}
