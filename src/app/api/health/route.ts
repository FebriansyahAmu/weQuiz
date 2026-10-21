import { connection } from "next/server";
import { db } from "@/server/db";

export async function GET() {
  // Database checks must run per request, never during prerendering.
  await connection();

  const startedAt = performance.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      db: "up",
      latencyMs: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    console.error("[health] database check failed", error);
    return Response.json({ status: "error", db: "down" }, { status: 503 });
  }
}
