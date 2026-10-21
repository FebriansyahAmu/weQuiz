import type { NextRequest } from "next/server";
import { saveAnswerSchema } from "@/lib/validation/exam";
import { handleRoute, parseAttemptId, parseJsonBody } from "@/server/http";
import { saveAnswer } from "@/server/services/attempt.service";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/attempts/[id]/answers">) {
  return handleRoute(async () => {
    const id = await parseAttemptId(ctx.params);
    const input = await parseJsonBody(request, saveAnswerSchema);
    return Response.json(await saveAnswer(id, input));
  });
}
