import { prisma } from "@/lib/prisma";
import { postToBluesky } from "@/lib/platforms/bluesky";

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

  for (const platform of post.platforms) {
    const account = post.user.accounts.find((a) => a.platform === platform);
    try {
      if (platform === "bluesky") {
        if (!account) throw new Error("No connected bluesky account.");
        const images = post.mediaUrls.length ? await fetchImages(post.mediaUrls) : [];
        const r = await postToBluesky(
          {
            identifier: account.platformUserId ?? "",
            appPassword: account.accessToken ?? "",
          },
          captionFor(post, "bluesky"),
          images
        );
        await prisma.postHistory.create({
          data: {
            postId: post.id,
            platform,
            platformPostId: r.uri,
            status: "published",
            sentAt: new Date(),
          },
        });
        results.push({ platform, ok: true });
      } else {
        // facebook / instagram / tiktok / threads — wired up in later phases.
        throw new Error(`${platform} publishing not implemented yet.`);
      }
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
