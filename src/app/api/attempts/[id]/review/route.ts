import type { NextRequest } from "next/server";
import { handleRoute, parseAttemptId } from "@/server/http";
import { getAttemptReview } from "@/server/services/attempt.service";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/attempts/[id]/review">) {
  return handleRoute(async () => {
    const id = await parseAttemptId(ctx.params);
    return Response.json(await getAttemptReview(id));
  });
}
