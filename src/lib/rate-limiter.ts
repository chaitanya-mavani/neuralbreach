// ---------------------------------------------------------------------------
// NeuralBreach – Rate Limiter
// Adaptive rate-limiting with exponential backoff, jitter, batch cooldowns,
// and automatic DDoS detection.
// ---------------------------------------------------------------------------

// -- Types ------------------------------------------------------------------

/** Configuration for the rate limiter. */
export interface RateLimiterConfig {
  /** Base delay between requests in milliseconds (before backoff). */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds (default ceiling: 30 000 ms). */
  maxDelayMs: number;
  /** Number of requests in a batch before triggering a cooldown pause. */
  batchSize: number;
  /** Duration of the cooldown pause after each batch, in milliseconds. */
  batchCooldownMs: number;
}

// -- Constants ---------------------------------------------------------------

/** Number of consecutive 429s that triggers DDoS-protection pause. */
const DDOS_THRESHOLD = 3;

/** Duration of the DDoS-protection pause in milliseconds. */
const DDOS_PAUSE_MS = 60_000;

/** Jitter factor: ±20 % of the computed delay. */
const JITTER_FACTOR = 0.2;

// -- Helpers -----------------------------------------------------------------

/**
 * Returns a promise that resolves after `ms` milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Apply ±20 % random jitter to a delay value.
 *
 * @param delay - The base delay to jitter.
 * @returns The delay with random jitter applied.
 */
function applyJitter(delay: number): number {
  const jitter = delay * JITTER_FACTOR;
  // Random value in range [-jitter, +jitter]
  return delay + (Math.random() * 2 - 1) * jitter;
}

// -- RateLimiter class -------------------------------------------------------

/**
 * Adaptive rate limiter designed for API fuzzing workloads.
 *
 * Features:
 * - **Exponential backoff** on 429 responses (doubles delay each time).
 * - **Random jitter** (±20 %) on all delays to avoid thundering-herd.
 * - **Batch cooldown** – pauses for a configurable duration after every N
 *   requests.
 * - **DDoS detection** – if 3+ consecutive 429s are received, pauses for 60 s.
 *
 * @example
 * ```ts
 * const limiter = new RateLimiter({
 *   baseDelayMs: 500,
 *   maxDelayMs: 30_000,
 *   batchSize: 10,
 *   batchCooldownMs: 5_000,
 * });
 *
 * for (const payload of payloads) {
 *   await limiter.waitForSlot();
 *   const res = await fetch(url, { body: payload });
 *   if (res.status === 429) {
 *     limiter.reportRateLimit();
 *   } else {
 *     limiter.reportSuccess();
 *   }
 * }
 * ```
 */
export class RateLimiter {
  private readonly config: Readonly<RateLimiterConfig>;

  /** Current backoff multiplier (doubles on each consecutive 429). */
  private backoffMultiplier: number = 1;

  /** Number of consecutive 429 responses received. */
  private consecutive429s: number = 0;

  /** Total number of requests completed in the current batch window. */
  private requestsInBatch: number = 0;

  /** Whether the limiter is currently in a DDoS-protection pause. */
  private inDDoSPause: boolean = false;

  constructor(config: RateLimiterConfig) {
    this.config = Object.freeze({ ...config });
  }

  // -- Public API ------------------------------------------------------------

  /**
   * Wait until it is safe to send the next request.
   *
   * This method enforces:
   * 1. Base delay with exponential backoff (capped at `maxDelayMs`).
   * 2. ±20 % random jitter.
   * 3. Batch cooldown after every `batchSize` requests.
   * 4. 60 s DDoS pause after 3+ consecutive 429s.
   */
  async waitForSlot(): Promise<void> {
    // ── DDoS detection pause ──────────────────────────────────────────
    if (this.inDDoSPause) {
      await sleep(applyJitter(DDOS_PAUSE_MS));
      this.inDDoSPause = false;
      // Reset backoff after the long DDoS pause
      this.backoffMultiplier = 1;
    }

    // ── Batch cooldown ────────────────────────────────────────────────
    if (
      this.config.batchSize > 0 &&
      this.requestsInBatch > 0 &&
      this.requestsInBatch % this.config.batchSize === 0
    ) {
      await sleep(applyJitter(this.config.batchCooldownMs));
    }

    // ── Exponential backoff with jitter ───────────────────────────────
    const rawDelay = this.config.baseDelayMs * this.backoffMultiplier;
    const cappedDelay = Math.min(rawDelay, this.config.maxDelayMs);
    const finalDelay = applyJitter(cappedDelay);

    if (finalDelay > 0) {
      await sleep(finalDelay);
    }

    // Count this as a request dispatched
    this.requestsInBatch++;
  }

  /**
   * Report that the most recent request succeeded (non-429 response).
   *
   * Resets the backoff multiplier and consecutive-429 counter.
   */
  reportSuccess(): void {
    this.backoffMultiplier = 1;
    this.consecutive429s = 0;
  }

  /**
   * Report that the most recent request received a 429 (rate-limited) response.
   *
   * Doubles the backoff multiplier and increments the consecutive-429 counter.
   * If the counter reaches the DDoS threshold (3), the next `waitForSlot()`
   * call will enforce a 60 s pause.
   */
  reportRateLimit(): void {
    this.consecutive429s++;
    this.backoffMultiplier = Math.min(
      this.backoffMultiplier * 2,
      // Prevent multiplier from growing beyond what maxDelayMs allows
      this.config.maxDelayMs / this.config.baseDelayMs,
    );

    if (this.consecutive429s >= DDOS_THRESHOLD) {
      this.inDDoSPause = true;
      // Reset counter so the next batch of 429s can re-trigger if needed
      this.consecutive429s = 0;
    }
  }

  /**
   * Reset all internal state to initial values.
   *
   * Useful when switching targets or starting a new fuzzing session.
   */
  reset(): void {
    this.backoffMultiplier = 1;
    this.consecutive429s = 0;
    this.requestsInBatch = 0;
    this.inDDoSPause = false;
  }

  // -- Introspection (useful for debugging / UI) -----------------------------

  /**
   * Get a snapshot of the limiter's current internal state.
   * Useful for dashboards and debugging.
   */
  getState(): {
    backoffMultiplier: number;
    consecutive429s: number;
    requestsInBatch: number;
    inDDoSPause: boolean;
  } {
    return {
      backoffMultiplier: this.backoffMultiplier,
      consecutive429s: this.consecutive429s,
      requestsInBatch: this.requestsInBatch,
      inDDoSPause: this.inDDoSPause,
    };
  }
}
