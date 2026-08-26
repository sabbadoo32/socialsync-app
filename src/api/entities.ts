/**
 * Drop-in replacement for the Base44 SDK's entity interface.
 * The ported SocialSync pages import { Post, Campaign, ... } from "@/api/entities"
 * exactly as before; these call our own Supabase-backed REST API instead.
 */

type Rec = Record<string, any>;

async function req(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`/api/entities/${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function makeEntity(name: string) {
  return {
    /** list(sort?, limit?) — e.g. list("-created_date", 200) */
    list(sort?: string, limit?: number): Promise<Rec[]> {
      const qs = new URLSearchParams();
      if (sort) qs.set("sort", sort);
      if (limit != null) qs.set("limit", String(limit));
      return req(`${name}?${qs.toString()}`);
    },
    /** filter(where, sort?, limit?) */
    filter(where: Rec, sort?: string, limit?: number): Promise<Rec[]> {
      const qs = new URLSearchParams();
      qs.set("where", JSON.stringify(where));
      if (sort) qs.set("sort", sort);
      if (limit != null) qs.set("limit", String(limit));
      return req(`${name}?${qs.toString()}`);
    },
    get(id: string): Promise<Rec> {
      return req(`${name}/${id}`);
    },
    create(payload: Rec): Promise<Rec> {
      return req(name, { method: "POST", body: JSON.stringify(payload) });
    },
    update(id: string, payload: Rec): Promise<Rec> {
      return req(`${name}/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    /** bulkUpdate([{id, ...fields}]) — updates several records in parallel. */
    bulkUpdate(items: Rec[]): Promise<Rec[]> {
      return Promise.all(
        items.map(({ id, ...rest }) =>
          req(`${name}/${id}`, { method: "PATCH", body: JSON.stringify(rest) })
        )
      );
    },
    delete(id: string): Promise<{ ok: boolean }> {
      return req(`${name}/${id}`, { method: "DELETE" });
    },
  };
}

export const Post = makeEntity("Post");
export const Campaign = makeEntity("Campaign");
export const MediaAsset = makeEntity("MediaAsset");
export const Comment = makeEntity("Comment");
export const User = makeEntity("User");
