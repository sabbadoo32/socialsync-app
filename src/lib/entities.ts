import { prisma } from "@/lib/prisma";

/**
 * Maps the Base44 entity names the frontend uses to our Prisma models,
 * so the ported SocialSync pages can keep calling `Post.list()` etc.
 * unchanged while the data actually comes from Supabase.
 */
export const ENTITY_MODELS = {
  Post: "post",
  Campaign: "campaign",
  MediaAsset: "mediaAsset",
  Comment: "comment",
  User: "user",
} as const;

export type EntityName = keyof typeof ENTITY_MODELS;

export function isEntity(name: string): name is EntityName {
  return name in ENTITY_MODELS;
}

// --- snake_case <-> camelCase, with Base44's created_date / updated_date ---

function toCamel(key: string): string {
  if (key === "created_date") return "createdAt";
  if (key === "updated_date") return "updatedAt";
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function toSnake(key: string): string {
  if (key === "createdAt") return "created_date";
  if (key === "updatedAt") return "updated_date";
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Convert an API payload (snake_case) into Prisma data (camelCase). */
export function payloadToPrisma(payload: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (k === "id" || k === "created_date" || k === "updated_date") continue;
    out[toCamel(k)] = v;
  }
  return out;
}

/** Convert a Prisma record (camelCase) into an API record (snake_case). */
export function recordToApi(record: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(record)) {
    out[toSnake(k)] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
}

/** Parse a Base44 sort string like "-created_date" into Prisma orderBy. */
export function parseSort(sort?: string | null): Record<string, "asc" | "desc"> {
  if (!sort) return { createdAt: "desc" };
  const desc = sort.startsWith("-");
  const field = toCamel(desc ? sort.slice(1) : sort);
  return { [field]: desc ? "desc" : "asc" };
}

/** Convert a Base44 filter object (snake_case keys) into a Prisma where. */
export function parseWhere(where?: Record<string, any> | null): Record<string, any> {
  if (!where) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(where)) out[toCamel(k)] = v;
  return out;
}

type Delegate = {
  findMany: (args: any) => Promise<any[]>;
  findUnique: (args: any) => Promise<any>;
  create: (args: any) => Promise<any>;
  update: (args: any) => Promise<any>;
  delete: (args: any) => Promise<any>;
};

export function delegateFor(entity: EntityName): Delegate {
  return (prisma as any)[ENTITY_MODELS[entity]] as Delegate;
}
