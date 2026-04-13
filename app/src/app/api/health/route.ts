import { corsHeaders, jsonResponse } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    /* db unreachable */
  }

  return jsonResponse(req, {
    ok: true,
    service: "brume-api",
    db: dbOk,
    helius: Boolean(process.env.HELIUS_API_KEY?.trim()),
  });
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}
