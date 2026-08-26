/**
 * Drop-in replacements for the Base44 integrations the pages use.
 * UploadFile posts to our own Supabase Storage-backed route.
 */

export async function UploadFile({ file }: { file: File }): Promise<{ file_url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/integrations/upload", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed (${res.status})`);
  }
  return res.json();
}

// Placeholder for AI content generation (wired to a real model later).
export async function InvokeLLM(_args: any): Promise<any> {
  throw new Error("InvokeLLM not implemented yet.");
}
