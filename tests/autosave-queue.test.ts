import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutosaveQueue, type AnswerPayload } from "@/lib/autosave-queue";

const answer = (ids: string[], flagged = false): AnswerPayload => ({ selectedOptionIds: ids, flagged });

class FatalError extends Error {}
class ClientError extends Error {}

function setup(save: (id: string, payload: AnswerPayload) => Promise<unknown>) {
  const onFatal = vi.fn();
  const queue = new AutosaveQueue(save, {
    debounceMs: 400,
    retryDelaysMs: [1_000, 2_000],
    isFatal: (e) => e instanceof FatalError,
    isRetryable: (e) => !(e instanceof ClientError),
    onFatal,
  });
  return { queue, onFatal };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("AutosaveQueue", () => {
  it("debounces rapid changes to one question into a single save of the latest value", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { queue } = setup(save);

    queue.enqueue("q1", answer(["a"]));
    await vi.advanceTimersByTimeAsync(200);
    queue.enqueue("q1", answer(["b"]));
    expect(queue.getSnapshot()).toMatchObject({ status: "pending", unsaved: 1 });

    await vi.advanceTimersByTimeAsync(400);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("q1", answer(["b"]));
    expect(queue.getSnapshot()).toMatchObject({ status: "saved", unsaved: 0 });
  });

  it("saves different questions independently", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { queue } = setup(save);
    queue.enqueue("q1", answer(["a"]));
    queue.enqueue("q2", answer(["c"]));
    await vi.advanceTimersByTimeAsync(400);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("never lets an older in-flight save finish after a newer one for the same question", async () => {
    const order: string[] = [];
    let releaseFirst!: () => void;
    const save = vi.fn((_id: string, payload: AnswerPayload) => {
      const value = payload.selectedOptionIds[0];
      if (value === "a") {
        return new Promise<void>((resolve) => {
          releaseFirst = () => {
            order.push("a");
            resolve();
          };
        });
      }
      order.push(value);
      return Promise.resolve();
    });
    const { queue } = setup(save);

    queue.enqueue("q1", answer(["a"]), { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    queue.enqueue("q1", answer(["b"]), { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(1); // "b" waits for "a"

    releaseFirst();
    await vi.advanceTimersByTimeAsync(0);
    expect(order).toEqual(["a", "b"]);
  });

  it("retries retryable failures with backoff and keeps the payload", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const { queue } = setup(save);

    queue.enqueue("q1", answer(["a"]), { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(queue.getSnapshot()).toMatchObject({ status: "retrying", unsaved: 1 });

    await vi.advanceTimersByTimeAsync(1_000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("q1", answer(["a"]));
    expect(queue.getSnapshot()).toMatchObject({ status: "saved", unsaved: 0 });
  });

  it("prefers a newer answer over retrying a failed older one", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const { queue } = setup(save);

    queue.enqueue("q1", answer(["a"]), { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    queue.enqueue("q1", answer(["b"]));
    await vi.advanceTimersByTimeAsync(2_000);
    // "a" failed once and was superseded: it is never retried.
    expect(save.mock.calls.map(([, payload]) => payload.selectedOptionIds[0])).toEqual(["a", "b"]);
  });

  it("drops non-retryable failures and reports an error", async () => {
    const save = vi.fn().mockRejectedValue(new ClientError("bad"));
    const { queue } = setup(save);
    queue.enqueue("q1", answer(["a"]), { immediate: true });
    await vi.advanceTimersByTimeAsync(5_000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(queue.getSnapshot()).toMatchObject({ status: "error", unsaved: 0 });
  });

  it("stops and notifies on fatal errors", async () => {
    const save = vi.fn().mockRejectedValue(new FatalError("locked"));
    const { queue, onFatal } = setup(save);
    queue.enqueue("q1", answer(["a"]), { immediate: true });
    await vi.advanceTimersByTimeAsync(0);
    expect(onFatal).toHaveBeenCalledOnce();

    queue.enqueue("q2", answer(["b"]), { immediate: true });
    await vi.advanceTimersByTimeAsync(5_000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("flush sends pending saves immediately and reports completion", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { queue } = setup(save);
    queue.enqueue("q1", answer(["a"]));
    queue.enqueue("q2", answer(["b"], true));
    await expect(queue.flush()).resolves.toBe(true);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("flush reports false while a save keeps failing", async () => {
    const save = vi.fn().mockRejectedValue(new Error("offline"));
    const { queue } = setup(save);
    queue.enqueue("q1", answer(["a"]));
    await expect(queue.flush()).resolves.toBe(false);
  });
});
