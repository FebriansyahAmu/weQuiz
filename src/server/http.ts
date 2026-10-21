import "server-only";
import { z } from "zod";
import { entityIdSchema } from "@/lib/validation/exam";
import { AppError, attemptNotFound } from "@/server/errors";
import type { ApiErrorBody } from "@/types/dto";

/** Runs a route handler body and converts thrown errors into JSON error responses. */
export async function handleRoute(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    return errorResponse(error);
  }
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    const body: ApiErrorBody = { error: { code: error.code, message: error.message, details: error.details } };
    return Response.json(body, { status: error.status });
  }
  console.error("[api] unexpected error", error);
  const body: ApiErrorBody = { error: { code: "INTERNAL_ERROR", message: "Terjadi kesalahan pada server." } };
  return Response.json(body, { status: 500 });
}

export async function parseJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("VALIDATION_ERROR", "Body permintaan harus berupa JSON yang valid.");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new AppError("VALIDATION_ERROR", "Data yang dikirim tidak valid.", z.flattenError(result.error));
  }
  return result.data;
}

/** Malformed ids can never match an attempt, so they are reported as not found. */
export async function parseAttemptId(params: Promise<{ id: string }>): Promise<string> {
  const { id } = await params;
  const result = entityIdSchema.safeParse(id);
  if (!result.success) throw attemptNotFound();
  return result.data;
}
