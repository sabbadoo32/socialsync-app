/**
 * TikTok Content Posting API (v2) integration.
 * STATUS: real code, INERT until a TikTok app exists (TIKTOK_CLIENT_KEY +
 * TIKTOK_CLIENT_SECRET). TikTok is VIDEO-ONLY — text/image posts don't apply.
 * Uses PULL_FROM_URL, which requires the video's domain to be verified in the
 * TikTok developer portal.
 */

export function tiktokConfigured(): boolean {
  return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

export function tiktokOauthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    scope: "video.publish",
    response_type: "code",
    redirect_uri: redirectUri,
    state,
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params}`;
}

export async function tiktokExchangeCode(
  code: string,
  redirectUri: string
): Promise<{ token: string; refreshToken: string; openId: string; expiresIn: number }> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || "TikTok token exchange failed");
  }
  return {
    token: data.access_token,
    refreshToken: data.refresh_token,
    openId: data.open_id,
    expiresIn: data.expires_in,
  };
}

export async function refreshTiktokToken(
  refreshToken: string
): Promise<{ token: string; refreshToken: string; expiresIn: number }> {
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || "TikTok token refresh failed");
  }
  return { token: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}

/** Publish a video by URL (PULL_FROM_URL). Returns the publish id to poll. */
export async function postToTikTok(
  token: string,
  caption: string,
  videoUrl: string
): Promise<{ publishId: string }> {
  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: { title: caption, privacy_level: "PUBLIC_TO_EVERYONE" },
      source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
    }),
  });
  const data = await res.json();
  if (!res.ok || data.error?.code !== "ok") {
    throw new Error(data.error?.message || "TikTok publish failed");
  }
  return { publishId: data.data.publish_id };
}
