import { z } from "zod";
import { OPTION_LABELS } from "@/lib/domain";
import { PRESET_KEYS } from "@/config/exam-presets";

/** Shared between the landing form (client) and the server action / API. */

export const participantNameSchema = z
  .string({ error: "Nama wajib diisi" })
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(2, "Nama minimal 2 karakter").max(80, "Nama maksimal 80 karakter"));

export const startExamSchema = z.object({
  name: participantNameSchema,
  presetKey: z.enum(PRESET_KEYS, { error: "Pilih paket ujian yang tersedia" }),
});
export type StartExamInput = z.infer<typeof startExamSchema>;

/** Prisma cuid() ids. */
export const entityIdSchema = z.string().regex(/^c[a-z0-9]{20,32}$/, "ID tidak valid");

export const saveAnswerSchema = z.object({
  questionId: entityIdSchema,
  selectedOptionIds: z.array(entityIdSchema).max(OPTION_LABELS.length),
  flagged: z.boolean().optional(),
});
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
