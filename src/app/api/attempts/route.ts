import { startExamSchema } from "@/lib/validation/exam";
import { handleRoute, parseJsonBody } from "@/server/http";
import { startAttempt } from "@/server/services/attempt.service";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const input = await parseJsonBody(request, startExamSchema);
    const result = await startAttempt(input);
    return Response.json(result, { status: 201 });
  });
}
