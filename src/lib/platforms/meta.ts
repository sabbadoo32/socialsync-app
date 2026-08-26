/**
 * Facebook (Meta Graph API) integration.
 *
 * STATUS: real code, but INERT until a Meta developer app exists.
 * Requires env META_APP_ID + META_APP_SECRET, and a Facebook Page the
 * connecting user administers. Posting targets Pages only (never personal
 * profiles) — that's a Meta API rule.
 */

const GRAPH = "https://graph.facebook.com/v21.0";

export function metaConfigured(): boolean {
  return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
}

export function oauthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: redirectUri,
    state,
    response_type: "code",
    scope: "pages_show_list,pages_manage_posts,pages_read_engagement",
  });
  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

/** Exchange an OAuth code for a short-lived user token. */
export async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Token exchange failed");
  return data.access_token;
}

/** Upgrade a short-lived user token to a long-lived (~60 day) one. */
export async function longLivedToken(userToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: userToken,
  });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Long-lived exchange failed");
  return data.access_token;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

/** List the Pages this user administers, each with its own page token. */
export async function listPages(userToken: string): Promise<FacebookPage[]> {
  const res = await fetch(`${GRAPH}/me/accounts?access_token=${userToken}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Failed to list Pages");
  return (data.data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    access_token: p.access_token,
  }));
}

export interface MetaPostResult {
  id: string;
}

/**
 * Publish to a Facebook Page. Text-only posts to /feed; a single image posts
 * to /photos with the image URL. (Multi-image/video: future.)
 */
export async function postToFacebookPage(
  pageId: string,
  pageToken: string,
  message: string,
  mediaUrls: string[] = []
): Promise<MetaPostResult> {
  if (mediaUrls.length > 0) {
    const body = new URLSearchParams({
      url: mediaUrls[0],
      caption: message,
      access_token: pageToken,
    });
    const res = await fetch(`${GRAPH}/${pageId}/photos`, { method: "POST", body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Facebook photo post failed");
    return { id: data.post_id || data.id };
  }
  const body = new URLSearchParams({ message, access_token: pageToken });
  const res = await fetch(`${GRAPH}/${pageId}/feed`, { method: "POST", body });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Facebook post failed");
  return { id: data.id };
}
