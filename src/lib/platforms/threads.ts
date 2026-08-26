/**
 * Threads integration (Meta's Threads API, graph.threads.net).
 * STATUS: real code, INERT until a Threads app exists (THREADS_APP_ID +
 * THREADS_APP_SECRET). Separate app from Facebook/Instagram.
 */

const THREADS = "https://graph.threads.net/v1.0";

export function threadsConfigured(): boolean {
  return Boolean(process.env.THREADS_APP_ID && process.env.THREADS_APP_SECRET);
}

export function threadsOauthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.THREADS_APP_ID!,
    redirect_uri: redirectUri,
    scope: "threads_basic,threads_content_publish",
    response_type: "code",
    state,
  });
  return `https://threads.net/oauth/authorize?${params}`;
}

export async function threadsExchangeCode(
  code: string,
  redirectUri: string
): Promise<{ token: string; userId: string }> {
  const res = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: process.env.THREADS_APP_ID!,
      client_secret: process.env.THREADS_APP_SECRET!,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_message || "Threads token exchange failed");
  return { token: data.access_token, userId: String(data.user_id) };
}

/** Two-step publish: create a text (or image) container, then publish it. */
export async function postToThreads(
  userId: string,
  token: string,
  text: string,
  mediaUrls: string[] = []
): Promise<{ id: string }> {
  const createBody = new URLSearchParams({ text, access_token: token });
  if (mediaUrls.length > 0) {
    const isVideo = /\.(mp4|mov|m4v)(\?|$)/i.test(mediaUrls[0]);
    createBody.set("media_type", isVideo ? "VIDEO" : "IMAGE");
    createBody.set(isVideo ? "video_url" : "image_url", mediaUrls[0]);
  } else {
    createBody.set("media_type", "TEXT");
  }
  const cRes = await fetch(`${THREADS}/${userId}/threads`, { method: "POST", body: createBody });
  const cData = await cRes.json();
  if (!cRes.ok) throw new Error(cData.error?.message || "Threads container failed");

  const pRes = await fetch(`${THREADS}/${userId}/threads_publish`, {
    method: "POST",
    body: new URLSearchParams({ creation_id: cData.id, access_token: token }),
  });
  const pData = await pRes.json();
  if (!pRes.ok) throw new Error(pData.error?.message || "Threads publish failed");
  return { id: pData.id };
}
