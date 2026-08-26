import { JWT } from "google-auth-library";

/**
 * Google Drive access via a service account. Share Drive folders with the
 * service account's email, and the app can list/read them — no per-user OAuth.
 * Set GOOGLE_SERVICE_ACCOUNT_KEY to the service account's JSON key (raw or base64).
 */

const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];

function loadCredentials(): { client_email: string; private_key: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith("{")
      ? raw
      : Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    return { client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
}

export function driveConfigured(): boolean {
  return loadCredentials() !== null;
}

let cachedClient: JWT | null = null;

function getClient(): JWT {
  const creds = loadCredentials();
  if (!creds) throw new Error("Google Drive not configured (missing GOOGLE_SERVICE_ACCOUNT_KEY).");
  if (!cachedClient) {
    cachedClient = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: SCOPES,
    });
  }
  return cachedClient;
}

async function authHeader(): Promise<string> {
  const client = getClient();
  const token = await client.getAccessToken();
  return `Bearer ${token.token}`;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  isFolder: boolean;
}

/** Service account email — the user shares Drive folders with this address. */
export function serviceAccountEmail(): string | null {
  return loadCredentials()?.client_email ?? null;
}

async function driveList(q: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    q,
    fields: "files(id,name,mimeType,thumbnailLink)",
    pageSize: "200",
    orderBy: "folder,name",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: { Authorization: await authHeader() },
  });
  if (!res.ok) throw new Error(`Drive list failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.files || []).map((f: any) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    thumbnailLink: f.thumbnailLink,
    isFolder: f.mimeType === "application/vnd.google-apps.folder",
  }));
}

/** List folders shared with the service account (top-level browsing). */
export function listFolders(): Promise<DriveFile[]> {
  return driveList("mimeType='application/vnd.google-apps.folder' and trashed=false");
}

/** List image/video files inside a folder. */
export function listMediaInFolder(folderId: string): Promise<DriveFile[]> {
  return driveList(
    `'${folderId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')`
  );
}

/** Fetch a file's bytes (for proxying/display and for publishing). */
export async function fetchDriveFile(
  id: string
): Promise<{ body: ArrayBuffer; mimeType: string }> {
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${id}?fields=mimeType&supportsAllDrives=true`,
    { headers: { Authorization: await authHeader() } }
  );
  const meta = await metaRes.json();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: await authHeader() } }
  );
  if (!res.ok) throw new Error(`Drive fetch failed (${res.status})`);
  return { body: await res.arrayBuffer(), mimeType: meta.mimeType || "application/octet-stream" };
}
