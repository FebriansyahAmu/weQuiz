import type { NextRequest } from "next/server";
import { handleRoute, parseAttemptId } from "@/server/http";
import { getAttemptResult } from "@/server/services/attempt.service";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/attempts/[id]/result">) {
  return handleRoute(async () => {
    const id = await parseAttemptId(ctx.params);
    return Response.json(await getAttemptResult(id));
  });
}
