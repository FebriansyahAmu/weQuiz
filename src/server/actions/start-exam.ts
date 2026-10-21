"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { startExamSchema } from "@/lib/validation/exam";
import { AppError } from "@/server/errors";
import { startAttempt } from "@/server/services/attempt.service";

export interface StartExamState {
  message?: string;
  fieldErrors?: { name?: string[]; presetKey?: string[] };
  values?: { name: string; presetKey: string };
}

/** Landing form action (use with useActionState). Redirects to the exam on success. */
export async function startExam(_prev: StartExamState, formData: FormData): Promise<StartExamState> {
  const values = {
    name: String(formData.get("name") ?? ""),
    presetKey: String(formData.get("presetKey") ?? ""),
  };

  const parsed = startExamSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  let attemptId: string;
  try {
    ({ attemptId } = await startAttempt(parsed.data));
  } catch (error) {
    if (!(error instanceof AppError)) console.error("[startExam] failed to start attempt", error);
    const message = error instanceof AppError ? error.message : "Gagal memulai ujian. Silakan coba lagi.";
    return { message, values };
  }

  redirect(`/exam/${attemptId}`);
}
