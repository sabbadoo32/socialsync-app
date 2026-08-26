"use client";

import { useEffect, useState, useRef } from "react";
import { MediaAsset } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import DriveImport from "@/components/DriveImport";
import { Upload, Search, Trash2, Image as ImageIcon, Video, HardDrive } from "lucide-react";

export default function MediaLibrary() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [driveOpen, setDriveOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = () => {
    setLoading(true);
    MediaAsset.list("-created_date", 200).then(setAssets).catch(() => {}).finally(() => setLoading(false));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const { file_url } = await UploadFile({ file });
        const isVideo = file.type.startsWith("video/");
        await MediaAsset.create({
          name: file.name.replace(/\.[^.]+$/, ""),
          file_url,
          type: isVideo ? "video" : "image",
          tags: [],
          source: "upload",
        });
      }
      toast({ title: "Upload complete" });
      loadAssets();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await MediaAsset.delete(id);
    setAssets(assets.filter((a) => a.id !== id));
  };

  const filtered = assets.filter((a) => a.name?.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Media Library" subtitle="Shared assets your team can reuse">
        <Button variant="outline" onClick={() => setDriveOpen(true)}>
          <HardDrive className="w-4 h-4 mr-1.5" /> Import from Drive
        </Button>
        <Button onClick={() => fileRef.current?.click()} className="bg-indigo-600 hover:bg-indigo-700">
          <Upload className="w-4 h-4 mr-1.5" /> {uploading ? "Uploading..." : "Upload"}
        </Button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </PageHeader>

      <DriveImport open={driveOpen} onClose={() => setDriveOpen(false)} onImported={loadAssets} />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search media by name..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{search ? "No media found." : "No media yet. Upload images and videos to get started."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map((asset) => (
            <div key={asset.id} className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="aspect-square bg-slate-100 relative">
                {asset.type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-slate-400" />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-slate-700 truncate">{asset.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{asset.source}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
