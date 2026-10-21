import type {
  ApiErrorBody,
  ApiErrorCode,
  AttemptResultDTO,
  AttemptSessionDTO,
  SaveAnswerResultDTO,
} from "@/types/dto";
import type { SaveAnswerInput } from "@/lib/validation/exam";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode | "NETWORK_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** Network failures and server errors are worth retrying; client errors are not. */
  get retryable() {
    return this.code === "NETWORK_ERROR" || this.status >= 500;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Tidak dapat terhubung ke server. Periksa koneksi Anda.");
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      // Non-JSON error page (e.g. a proxy); fall back to a generic message.
    }
    throw new ApiError(
      response.status,
      body?.error.code ?? "INTERNAL_ERROR",
      body?.error.message ?? "Terjadi kesalahan pada server.",
    );
  }

  return (await response.json()) as T;
}

export const api = {
  getAttempt: (attemptId: string) => request<AttemptSessionDTO>(`/api/attempts/${attemptId}`),

  saveAnswer: (attemptId: string, body: SaveAnswerInput) =>
    request<SaveAnswerResultDTO>(`/api/attempts/${attemptId}/answers`, {
      method: "PUT",
      body: JSON.stringify(body),
      // Lets the last save finish even if the tab is closing.
      keepalive: true,
    }),

  submit: (attemptId: string) =>
    request<AttemptResultDTO>(`/api/attempts/${attemptId}/submit`, { method: "POST" }),
};
