import type { NextRequest } from "next/server";
import { handleRoute, parseAttemptId } from "@/server/http";
import { getAttemptSession } from "@/server/services/attempt.service";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/attempts/[id]">) {
  return handleRoute(async () => {
    const id = await parseAttemptId(ctx.params);
    return Response.json(await getAttemptSession(id));
  });
}
