/**
 * Framework-agnostic autosave queue for exam answers.
 *
 * - Debounces per question and only sends the latest payload.
 * - Serializes requests per question so an older save never overwrites a newer one.
 * - Retries retryable failures with backoff; drops non-retryable ones.
 * - Stops for good on fatal errors (attempt locked / expired).
 *
 * Exposes a snapshot for React's useSyncExternalStore.
 */

export interface AnswerPayload {
  selectedOptionIds: string[];
  flagged: boolean;
}

export type SaveStatus = "idle" | "pending" | "saving" | "retrying" | "saved" | "error";

export interface AutosaveSnapshot {
  status: SaveStatus;
  /** Questions with changes not yet confirmed by the server. */
  unsaved: number;
  lastSavedAt: number | null;
  errorMessage: string | null;
}

export interface AutosaveOptions {
  debounceMs?: number;
  retryDelaysMs?: readonly number[];
  isFatal?: (error: unknown) => boolean;
  isRetryable?: (error: unknown) => boolean;
  onFatal?: (error: unknown) => void;
  describeError?: (error: unknown) => string;
}

type SaveFn = (questionId: string, payload: AnswerPayload) => Promise<unknown>;

const DEFAULT_RETRY_DELAYS = [1_000, 2_000, 4_000, 8_000, 15_000];

export class AutosaveQueue {
  private readonly pending = new Map<string, AnswerPayload>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly inFlight = new Map<string, Promise<void>>();
  private readonly listeners = new Set<() => void>();
  private failures = 0;
  private stopped = false;
  private lastSavedAt: number | null = null;
  private errorMessage: string | null = null;
  private snapshot: AutosaveSnapshot = { status: "idle", unsaved: 0, lastSavedAt: null, errorMessage: null };
  private fatalHandler: ((error: unknown) => void) | undefined;

  constructor(
    private readonly save: SaveFn,
    private readonly options: AutosaveOptions = {},
  ) {
    this.fatalHandler = options.onFatal;
  }

  /** Replaces the fatal-error callback (lets React wire it up after render). */
  setFatalHandler(handler: ((error: unknown) => void) | undefined) {
    this.fatalHandler = handler;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  enqueue(questionId: string, payload: AnswerPayload, { immediate = false } = {}) {
    if (this.stopped) return;
    this.pending.set(questionId, payload);
    this.schedule(questionId, immediate ? 0 : (this.options.debounceMs ?? 400));
    this.emit();
  }

  /** Sends everything pending now. Resolves true when nothing is left unsaved. */
  async flush(): Promise<boolean> {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
    await Promise.all([...this.pending.keys()].map((id) => this.send(id)));
    await Promise.all(this.inFlight.values());
    return this.pending.size === 0 && this.inFlight.size === 0;
  }

  /** Reschedules pending saves immediately (e.g. when the browser comes back online). */
  retryNow() {
    for (const id of this.pending.keys()) this.schedule(id, 0);
  }

  /** Clears timers without discarding pending payloads (component unmount). */
  pause() {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }

  /** Permanently stops the queue (after submit or a fatal error). */
  stop() {
    this.stopped = true;
    this.pause();
    this.pending.clear();
    this.emit();
  }

  private schedule(questionId: string, delay: number) {
    clearTimeout(this.timers.get(questionId));
    this.timers.set(
      questionId,
      setTimeout(() => {
        this.timers.delete(questionId);
        void this.send(questionId);
      }, delay),
    );
  }

  private async send(questionId: string): Promise<void> {
    const previous = this.inFlight.get(questionId);
    if (previous) await previous;

    const payload = this.pending.get(questionId);
    if (this.stopped || !payload) return;
    this.pending.delete(questionId);

    const task = this.save(questionId, payload).then(
      () => {
        this.failures = 0;
        this.errorMessage = null;
        this.lastSavedAt = Date.now();
      },
      (error: unknown) => this.handleFailure(questionId, payload, error),
    );

    this.inFlight.set(questionId, task);
    this.emit();
    try {
      await task;
    } finally {
      if (this.inFlight.get(questionId) === task) this.inFlight.delete(questionId);
      this.emit();
    }
  }

  private handleFailure(questionId: string, payload: AnswerPayload, error: unknown) {
    this.errorMessage = this.options.describeError?.(error) ?? "Gagal menyimpan jawaban.";

    if (this.options.isFatal?.(error)) {
      this.stop();
      this.fatalHandler?.(error);
      return;
    }

    if (this.options.isRetryable?.(error) ?? true) {
      // Keep a newer payload if the user changed the answer meanwhile.
      if (!this.pending.has(questionId)) this.pending.set(questionId, payload);
      const delays = this.options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS;
      this.schedule(questionId, delays[Math.min(this.failures, delays.length - 1)]);
      this.failures++;
    }
  }

  private emit() {
    const unsaved = new Set([...this.pending.keys(), ...this.inFlight.keys()]).size;
    let status: SaveStatus;
    if (this.inFlight.size > 0) status = "saving";
    else if (this.pending.size > 0) status = this.failures > 0 ? "retrying" : "pending";
    else if (this.errorMessage) status = "error";
    else status = this.lastSavedAt === null ? "idle" : "saved";

    const errorMessage = status === "retrying" || status === "error" ? this.errorMessage : null;
    const next: AutosaveSnapshot = { status, unsaved, lastSavedAt: this.lastSavedAt, errorMessage };
    const prev = this.snapshot;
    if (
      prev.status === next.status &&
      prev.unsaved === next.unsaved &&
      prev.lastSavedAt === next.lastSavedAt &&
      prev.errorMessage === next.errorMessage
    ) {
      return;
    }
    this.snapshot = next;
    for (const listener of this.listeners) listener();
  }
}
