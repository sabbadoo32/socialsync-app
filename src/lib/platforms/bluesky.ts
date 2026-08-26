import { AtpAgent, RichText } from "@atproto/api";

export interface BlueskyCredentials {
  /** Handle like "you.bsky.social" or a DID. */
  identifier: string;
  /** An App Password (Settings > App Passwords), NOT your main password. */
  appPassword: string;
  /** Personal Data Server. Defaults to the public Bluesky PDS. */
  service?: string;
}

export interface BlueskyImage {
  /** Raw image bytes. */
  data: Uint8Array;
  /** e.g. "image/jpeg", "image/png". */
  mimeType: string;
  /** Alt text (accessibility). */
  alt?: string;
}

export interface BlueskyPostResult {
  uri: string;
  cid: string;
}

/**
 * Create an authenticated AT Protocol agent for a single user's credentials.
 * Bluesky uses App Password auth — no OAuth flow required.
 */
async function login(creds: BlueskyCredentials): Promise<AtpAgent> {
  const agent = new AtpAgent({ service: creds.service ?? "https://bsky.social" });
  try {
    await agent.login({
      identifier: creds.identifier,
      password: creds.appPassword,
    });
  } catch (err: any) {
    // Normalize the common failure modes into readable messages.
    const status = err?.status;
    if (status === 401) {
      throw new Error("Bluesky auth failed: invalid handle or app password.");
    }
    if (status === 429) {
      throw new Error("Bluesky rate limit hit during login. Try again shortly.");
    }
    throw new Error(`Bluesky login error: ${err?.message ?? "unknown error"}`);
  }
  return agent;
}

/**
 * Post text (with optional images) to Bluesky.
 * Handles rich-text facets (links, mentions, hashtags) and image uploads.
 */
export async function postToBluesky(
  creds: BlueskyCredentials,
  text: string,
  images: BlueskyImage[] = []
): Promise<BlueskyPostResult> {
  const agent = await login(creds);

  // Detect links/mentions/tags so they render as real facets.
  const rt = new RichText({ text });
  await rt.detectFacets(agent);

  const record: Record<string, any> = {
    $type: "app.bsky.feed.post",
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date().toISOString(),
  };

  if (images.length > 0) {
    if (images.length > 4) {
      throw new Error("Bluesky allows at most 4 images per post.");
    }
    const uploaded = [];
    for (const img of images) {
      try {
        const res = await agent.uploadBlob(img.data, { encoding: img.mimeType });
        uploaded.push({ alt: img.alt ?? "", image: res.data.blob });
      } catch (err: any) {
        throw new Error(`Bluesky image upload failed: ${err?.message ?? "unknown"}`);
      }
    }
    record.embed = { $type: "app.bsky.embed.images", images: uploaded };
  }

  try {
    const res = await agent.post(record as any);
    return { uri: res.uri, cid: res.cid };
  } catch (err: any) {
    if (err?.status === 429) {
      throw new Error("Bluesky rate limit hit while posting. Try again shortly.");
    }
    throw new Error(`Bluesky post failed: ${err?.message ?? "unknown error"}`);
  }
}

/** Verify credentials work without publishing anything. Returns the resolved DID. */
export async function verifyBlueskyConnection(
  creds: BlueskyCredentials
): Promise<{ did: string; handle: string }> {
  const agent = await login(creds);
  return {
    did: agent.session?.did ?? "",
    handle: agent.session?.handle ?? creds.identifier,
  };
}
