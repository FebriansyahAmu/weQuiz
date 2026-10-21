import type { NextRequest } from "next/server";
import { handleRoute, parseAttemptId } from "@/server/http";
import { submitAttempt } from "@/server/services/attempt.service";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/attempts/[id]/submit">) {
  return handleRoute(async () => {
    const id = await parseAttemptId(ctx.params);
    return Response.json(await submitAttempt(id));
  });
}
