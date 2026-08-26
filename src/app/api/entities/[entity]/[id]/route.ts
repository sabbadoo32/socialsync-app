import { NextRequest, NextResponse } from "next/server";
import {
  isEntity,
  delegateFor,
  recordToApi,
  payloadToPrisma,
} from "@/lib/entities";

export const dynamic = "force-dynamic";

/** GET /api/entities/:entity/:id */
export async function GET(
  _req: NextRequest,
  { params }: { params: { entity: string; id: string } }
) {
  const { entity, id } = params;
  if (!isEntity(entity)) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }
  const row = await delegateFor(entity).findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(recordToApi(row));
}

/** PATCH /api/entities/:entity/:id  — update */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { entity: string; id: string } }
) {
  const { entity, id } = params;
  if (!isEntity(entity)) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const updated = await delegateFor(entity).update({
    where: { id },
    data: payloadToPrisma(body),
  });
  return NextResponse.json(recordToApi(updated));
}

/** DELETE /api/entities/:entity/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { entity: string; id: string } }
) {
  const { entity, id } = params;
  if (!isEntity(entity)) {
    return NextResponse.json({ error: "Unknown entity" }, { status: 404 });
  }
  await delegateFor(entity).delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
