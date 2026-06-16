import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Camera, Trash2, Upload, GripVertical, X, ImageIcon, Loader2, ChevronLeft, ChevronRight
} from "lucide-react";

interface GaleriePhotosProps {
  roomId: number;
  roomNumber: string;
  open: boolean;
  onClose: () => void;
}

export default function GaleriePhotos({ roomId, roomNumber, open, onClose }: GaleriePhotosProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: photos = [], isLoading } = trpc.roomPhotos.list.useQuery(
    { roomId },
    { enabled: open }
  );

  const deleteMutation = trpc.roomPhotos.delete.useMutation({
    onSuccess: () => {
      utils.roomPhotos.list.invalidate({ roomId });
      toast.success("Photo supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const reorderMutation = trpc.roomPhotos.reorder.useMutation({
    onSuccess: () => utils.roomPhotos.list.invalidate({ roomId }),
  });

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!fileArray.length) {
        toast.error("Seules les images sont acceptées");
        return;
      }
      if (fileArray.length > 20) {
        toast.error("Maximum 20 photos à la fois");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        fileArray.forEach((f) => formData.append("photos", f));

        const res = await fetch(`/api/rooms/${roomId}/photos`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erreur upload" }));
          throw new Error(err.error ?? "Erreur upload");
        }

        const data = await res.json();
        utils.roomPhotos.list.invalidate({ roomId });
        toast.success(`${data.photos.length} photo(s) ajoutée(s)`);
      } catch (err: any) {
        toast.error(err.message ?? "Erreur lors de l'upload");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [roomId, utils]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDelete = (photoId: number) => {
    if (confirm("Supprimer cette photo ?")) {
      deleteMutation.mutate({ photoId });
    }
  };

  const movePhoto = (index: number, direction: "up" | "down") => {
    const newPhotos = [...photos];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;
    [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];
    reorderMutation.mutate({
      photos: newPhotos.map((p, i) => ({ id: p.id, sortOrder: i })),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Galerie — Chambre {roomNumber}
              <Badge variant="secondary" className="ml-2">{photos.length} photo(s)</Badge>
            </DialogTitle>
          </DialogHeader>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-blue-600">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-medium">Upload en cours...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">
                  Glissez-déposez vos photos ici ou cliquez pour sélectionner
                </span>
                <span className="text-xs text-gray-400">JPG, PNG, WebP — max 10 MB par fichier — max 20 photos</span>
              </div>
            )}
          </div>

          {/* Photos grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
              <ImageIcon className="h-12 w-12" />
              <p className="text-sm">Aucune photo pour cette chambre</p>
              <p className="text-xs">Ajoutez des photos pour présenter la chambre aux clients</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50 aspect-[4/3]"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? `Photo ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                    onClick={() => setPreviewIndex(index)}
                  />

                  {/* Overlay controls */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); setPreviewIndex(index); }}
                      title="Aperçu"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                      disabled={deleteMutation.isPending}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Order badge */}
                  <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                    {index + 1}
                  </div>

                  {/* Reorder arrows */}
                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {index > 0 && (
                      <button
                        className="bg-white/80 hover:bg-white rounded p-0.5"
                        onClick={(e) => { e.stopPropagation(); movePhoto(index, "up"); }}
                        title="Déplacer à gauche"
                      >
                        <ChevronLeft className="h-3 w-3 text-gray-700" />
                      </button>
                    )}
                    {index < photos.length - 1 && (
                      <button
                        className="bg-white/80 hover:bg-white rounded p-0.5"
                        onClick={(e) => { e.stopPropagation(); movePhoto(index, "down"); }}
                        title="Déplacer à droite"
                      >
                        <ChevronRight className="h-3 w-3 text-gray-700" />
                      </button>
                    )}
                  </div>

                  {/* Caption */}
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                      {photo.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Fermer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox preview */}
      {previewIndex !== null && photos[previewIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setPreviewIndex(null)}
          >
            <X className="h-8 w-8" />
          </button>

          {previewIndex > 0 && (
            <button
              className="absolute left-4 text-white hover:text-gray-300 bg-black/40 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); setPreviewIndex(previewIndex - 1); }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          <img
            src={photos[previewIndex].url}
            alt={photos[previewIndex].caption ?? `Photo ${previewIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {previewIndex < photos.length - 1 && (
            <button
              className="absolute right-4 text-white hover:text-gray-300 bg-black/40 rounded-full p-2"
              onClick={(e) => { e.stopPropagation(); setPreviewIndex(previewIndex + 1); }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          <div className="absolute bottom-4 text-white text-sm">
            {previewIndex + 1} / {photos.length}
            {photos[previewIndex].caption && (
              <span className="ml-2 text-gray-300">— {photos[previewIndex].caption}</span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
