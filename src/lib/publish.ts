import { prisma } from "@/lib/prisma";
import { postToBluesky } from "@/lib/platforms/bluesky";
import { postToFacebookPage, getInstagramAccount, postToInstagram } from "@/lib/platforms/meta";
import { postToThreads } from "@/lib/platforms/threads";
import { postToTikTok } from "@/lib/platforms/tiktok";

const MAX_RETRIES = 3;

async function fetchImages(urls: string[]) {
  const images = [];
  for (const url of urls) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch media: ${url} (${res.status})`);
    const mimeType = res.headers.get("content-type") ?? "image/jpeg";
    const data = new Uint8Array(await res.arrayBuffer());
    images.push({ data, mimeType });
  }
  return images;
}

/** Resolve the caption for a given platform (override falls back to base). */
function captionFor(post: { baseCaption: string | null; captionOverrides: any }, platform: string): string {
  const overrides = (post.captionOverrides ?? {}) as Record<string, string>;
  return overrides[platform] ?? post.baseCaption ?? "";
}

/**
 * Publish one post to every platform it targets. Records a PostHistory row
 * per platform and updates the post's overall status.
 */
export async function publishPost(postId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: { include: { accounts: true } } },
  });
  if (!post) return;

  await prisma.post.update({
    where: { id: post.id },
    data: { status: "publishing" },
  });

  const results: { platform: string; ok: boolean; error?: string }[] = [];
  const accounts = post.user.accounts;

  for (const platform of post.platforms) {
    try {
      let platformPostId: string;

      if (platform === "bluesky") {
        const account = accounts.find((a) => a.platform === "bluesky");
        if (!account) throw new Error("No connected bluesky account.");
        const images = post.mediaUrls.length ? await fetchImages(post.mediaUrls) : [];
        const r = await postToBluesky(
          { identifier: account.platformUserId ?? "", appPassword: account.accessToken ?? "" },
          captionFor(post, "bluesky"),
          images
        );
        platformPostId = r.uri;
      } else if (platform === "facebook") {
        const account = accounts.find((a) => a.platform === "facebook");
        if (!account) throw new Error("No connected facebook account.");
        const r = await postToFacebookPage(
          account.platformUserId ?? "",
          account.accessToken ?? "",
          captionFor(post, "facebook"),
          post.mediaUrls
        );
        platformPostId = r.id;
      } else if (platform === "instagram") {
        // Instagram rides on the connected Facebook Page (needs a linked IG Business account).
        const account = accounts.find((a) => a.platform === "facebook");
        if (!account) throw new Error("Connect a Facebook Page first (Instagram posts through it).");
        const igId = await getInstagramAccount(account.platformUserId ?? "", account.accessToken ?? "");
        if (!igId) throw new Error("No Instagram Business account linked to the Facebook Page.");
        const r = await postToInstagram(
          igId,
          account.accessToken ?? "",
          captionFor(post, "instagram"),
          post.mediaUrls
        );
        platformPostId = r.id;
      } else if (platform === "threads") {
        const account = accounts.find((a) => a.platform === "threads");
        if (!account) throw new Error("No connected threads account.");
        const r = await postToThreads(
          account.platformUserId ?? "",
          account.accessToken ?? "",
          captionFor(post, "threads"),
          post.mediaUrls
        );
        platformPostId = r.id;
      } else if (platform === "tiktok") {
        const account = accounts.find((a) => a.platform === "tiktok");
        if (!account) throw new Error("No connected tiktok account.");
        const videoUrl = post.mediaUrls.find((u) => /\.(mp4|mov|m4v)(\?|$)/i.test(u));
        if (!videoUrl) throw new Error("TikTok requires a video.");
        const r = await postToTikTok(account.accessToken ?? "", captionFor(post, "tiktok"), videoUrl);
        platformPostId = r.publishId;
      } else {
        throw new Error(`${platform} publishing not implemented.`);
      }

      await prisma.postHistory.create({
        data: { postId: post.id, platform, platformPostId, status: "published", sentAt: new Date() },
      });
      results.push({ platform, ok: true });
    } catch (err: any) {
      const message = err?.message ?? "unknown error";
      await prisma.postHistory.create({
        data: { postId: post.id, platform, status: "failed", errorMessage: message },
      });
      results.push({ platform, ok: false, error: message });
    }
  }

  const allOk = results.every((r) => r.ok);
  const anyOk = results.some((r) => r.ok);

  if (allOk) {
    await prisma.post.update({
      where: { id: post.id },
      data: { status: "published", publishedDate: new Date(), errorLog: null },
    });
  } else {
    const errorLog = results
      .filter((r) => !r.ok)
      .map((r) => `${r.platform}: ${r.error}`)
      .join("; ");
    const nextRetry = post.retryCount + 1;
    const shouldRetry = !anyOk && nextRetry < MAX_RETRIES;
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: shouldRetry ? "scheduled" : "failed",
        retryCount: nextRetry,
        errorLog,
      },
    });
  }
}

/** Find and publish all posts that are due. Called by the cron route. */
export async function processDuePosts(now = new Date()): Promise<{ processed: number }> {
  const due = await prisma.post.findMany({
    where: { status: "scheduled", scheduledDate: { lte: now } },
    select: { id: true },
    take: 50,
  });

  for (const p of due) {
    await publishPost(p.id);
  }

  return { processed: due.length };
}
