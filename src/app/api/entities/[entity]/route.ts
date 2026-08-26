import { NextRequest, NextResponse } from "next/server";
import {
  isEntity,
  delegateFor,
  parseSort,
  parseWhere,
  recordToApi,
  payloadToPrisma,
} from "@/lib/entities";
import { getCurrentUserId } from "@/lib/current-user";

export const dynamic = "force-dynamic";

// Entities that are scoped to the owning user.
const USER_SCOPED = new Set(["Post", "Campaign", "MediaAsset"]);

/** GET /api/entities/:entity?sort=-created_date&limit=200&where={...} */
export async function GET(
  req: NextRequest,
  { params }: { params: { entity: string } }
) {
  const { entity } = params;
  if (!isEntity(entity)) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const sp = req.nextUrl.searchParams;
  const sort = sp.get("sort");
  const limit = sp.get("limit") ? Number(sp.get("limit")) : undefined;
  let where: Record<string, any> = {};
  const whereParam = sp.get("where");
  if (whereParam) {
    try {
      where = parseWhere(JSON.parse(whereParam));
    } catch {
      return NextResponse.json({ error: "Invalid where filter" }, { status: 400 });
    }
  }

  if (USER_SCOPED.has(entity)) {
    where.userId = await getCurrentUserId();
  }

  const rows = await delegateFor(entity).findMany({
    where,
    orderBy: parseSort(sort),
    take: limit,
  });

  return NextResponse.json(rows.map(recordToApi));
}

/** POST /api/entities/:entity  — create */
export async function POST(
  req: NextRequest,
  { params }: { params: { entity: string } }
) {
  const { entity } = params;
  if (!isEntity(entity)) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = payloadToPrisma(body);
  if (USER_SCOPED.has(entity)) {
    data.userId = await getCurrentUserId();
  }

  const created = await delegateFor(entity).create({ data });
  return NextResponse.json(recordToApi(created), { status: 201 });
}
