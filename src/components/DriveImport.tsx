"use client";

import { useEffect, useState } from "react";
import { MediaAsset } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FolderOpen, ChevronLeft, X, Check, Loader2, Video } from "lucide-react";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  isFolder: boolean;
};

export default function DriveImport({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { toast } = useToast();
  const [status, setStatus] = useState<{ configured: boolean; serviceAccountEmail: string | null } | null>(null);
  const [folder, setFolder] = useState<DriveFile | null>(null);
  const [items, setItems] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFolder(null);
    setSelected(new Set());
    fetch("/api/integrations/drive/status")
      .then((r) => r.json())
      .then((s) => {
        setStatus(s);
        if (s.configured) loadFolders();
      })
      .catch(() => setStatus({ configured: false, serviceAccountEmail: null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadFolders = () => {
    setLoading(true);
    setFolder(null);
    fetch("/api/integrations/drive/folders")
      .then((r) => r.json())
      .then((d) => setItems(d.files || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  const openFolder = (f: DriveFile) => {
    setLoading(true);
    setFolder(f);
    setSelected(new Set());
    fetch(`/api/integrations/drive/folders?folderId=${f.id}`)
      .then((r) => r.json())
      .then((d) => setItems(d.files || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const importSelected = async () => {
    const files = items.filter((f) => selected.has(f.id));
    if (files.length === 0) return;
    setImporting(true);
    try {
      for (const f of files) {
        await MediaAsset.create({
          name: f.name.replace(/\.[^.]+$/, ""),
          file_url: `/api/integrations/drive/media?id=${f.id}`,
          thumbnail_url: `/api/integrations/drive/media?id=${f.id}`,
          type: f.mimeType.startsWith("video/") ? "video" : "image",
          source: "google_drive",
          google_drive_id: f.id,
          tags: [],
        });
      }
      toast({ title: `Imported ${files.length} file${files.length > 1 ? "s" : ""}` });
      onImported();
      onClose();
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {folder && (
              <button onClick={loadFolders} className="text-slate-400 hover:text-slate-700">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="font-semibold text-slate-800">
              {folder ? folder.name : "Import from Google Drive"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {status && !status.configured ? (
            <div className="text-center py-8">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium mb-1">Google Drive isn't connected yet</p>
              <p className="text-sm text-slate-500">
                Once it's set up, share your Drive folders with the app's service account and
                they'll show up here.
              </p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">
              {folder ? (
                <>No images or videos in this folder.</>
              ) : (
                <>
                  No shared folders found.{" "}
                  {status?.serviceAccountEmail && (
                    <>
                      Share a Drive folder with{" "}
                      <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
                        {status.serviceAccountEmail}
                      </span>{" "}
                      first.
                    </>
                  )}
                </>
              )}
            </div>
          ) : folder ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggle(f.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    selected.has(f.id) ? "border-indigo-600" : "border-transparent"
                  }`}
                >
                  {f.mimeType.startsWith("video/") ? (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                      <Video className="w-6 h-6 text-slate-400" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/integrations/drive/media?id=${f.id}`}
                      alt={f.name}
                      className="w-full h-full object-cover bg-slate-100"
                    />
                  )}
                  {selected.has(f.id) && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((f) => (
                <button
                  key={f.id}
                  onClick={() => openFolder(f)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 text-left"
                >
                  <FolderOpen className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {folder && items.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">{selected.size} selected</span>
            <Button
              onClick={importSelected}
              disabled={selected.size === 0 || importing}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {importing ? "Importing..." : `Import ${selected.size || ""}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
