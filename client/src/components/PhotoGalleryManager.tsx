import { useState, useRef, useEffect } from "react";
import { compressImage, formatFileSize } from "@/hooks/useImageCompressor";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ImagePlus,
  Trash2,
  Pencil,
  Check,
  X,
  Upload,
  Images,
  Loader2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

type Photo = {
  id: number;
  companyId: number;
  url: string;
  fileKey: string;
  caption: string | null;
  sortOrder: number;
  createdAt: Date;
};

// ─── Carte photo triable ──────────────────────────────────────────────────────
function SortablePhotoCard({
  photo,
  onEdit,
  onDelete,
  onLightbox,
  editingId,
  editCaption,
  setEditCaption,
  onSaveEdit,
  onCancelEdit,
}: {
  photo: Photo;
  onEdit: (p: Photo) => void;
  onDelete: (id: number) => void;
  onLightbox: (p: Photo) => void;
  editingId: number | null;
  editCaption: string;
  setEditCaption: (v: string) => void;
  onSaveEdit: (id: number) => void;
  onCancelEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-xl overflow-hidden border shadow-sm bg-white"
    >
      {/* Poignée drag */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        title="Glisser pour réordonner"
      >
        <GripVertical className="h-4 w-4 text-gray-500" />
      </div>

      {/* Image cliquable pour lightbox */}
      <div className="cursor-zoom-in" onClick={() => onLightbox(photo)}>
        <img
          src={photo.url}
          alt={photo.caption ?? "Photo"}
          className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
          draggable={false}
        />
      </div>

      {/* Légende */}
      <div className="p-2">
        {editingId === photo.id ? (
          <div className="flex gap-1">
            <Input
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              className="h-7 text-xs flex-1"
              maxLength={300}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit(photo.id);
                if (e.key === "Escape") onCancelEdit();
              }}
            />
            <Button
              size="sm"
              className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600"
              onClick={() => onSaveEdit(photo.id)}
            >
              <Check className="h-3 w-3 text-white" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={onCancelEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <p
            className="text-xs text-gray-600 truncate cursor-pointer hover:text-[#E8751A]"
            onClick={() => onEdit(photo)}
            title={photo.caption ?? "Cliquez pour ajouter une légende"}
          >
            {photo.caption || (
              <span className="text-gray-300 italic">Ajouter une légende…</span>
            )}
          </p>
        )}
      </div>

      {/* Actions overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-blue-50"
          onClick={() => onEdit(photo)}
          title="Modifier la légende"
        >
          <Pencil className="h-3.5 w-3.5 text-blue-600" />
        </button>
        <button
          className="w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-red-50"
          onClick={() => {
            if (confirm("Supprimer cette photo ?")) onDelete(photo.id);
          }}
          title="Supprimer"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function PhotoGalleryManager() {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [pendingCaption, setPendingCaption] = useState("");
  const [pendingFile, setPendingFile] = useState<{ base64: string; mimeType: string } | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{ original: number; compressed: number } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  // État local des photos pour les mises à jour optimistes du DnD
  const [localPhotos, setLocalPhotos] = useState<Photo[] | null>(null);

  const { data: serverPhotos = [], isLoading } = trpc.photos.listMyPhotos.useQuery();

  // Synchroniser l'état local quand les données serveur arrivent
  useEffect(() => {
    if (serverPhotos && serverPhotos.length >= 0) {
      setLocalPhotos(serverPhotos as Photo[]);
    }
  }, [serverPhotos]);

  const photos: Photo[] = localPhotos ?? (serverPhotos as Photo[]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const uploadPhoto = trpc.photos.uploadPhoto.useMutation({
    onSuccess: () => {
      setPendingFile(null);
      setPendingCaption("");
      utils.photos.listMyPhotos.invalidate();
      toast.success("Photo ajoutée à votre bibliothèque !");
    },
    onError: (e) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  const updateCaption = trpc.photos.updateCaption.useMutation({
    onSuccess: () => {
      setEditingId(null);
      utils.photos.listMyPhotos.invalidate();
      toast.success("Légende mise à jour");
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePhoto = trpc.photos.deletePhoto.useMutation({
    onSuccess: () => {
      utils.photos.listMyPhotos.invalidate();
      toast.success("Photo supprimée");
    },
    onError: (e) => toast.error(e.message),
  });

  const reorderPhotos = trpc.photos.reorderPhotos.useMutation({
    onError: (e) => {
      toast.error("Erreur lors de la sauvegarde de l'ordre");
      utils.photos.listMyPhotos.invalidate(); // Resync avec le serveur
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(photos, oldIndex, newIndex);
    // Mise à jour optimiste immédiate
    setLocalPhotos(reordered);
    // Sauvegarder en base
    reorderPhotos.mutate({ orderedIds: reordered.map((p) => p.id) });
  }

  // Limite de 20 photos par compagnie
  const MAX_PHOTOS = 20;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner une image (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image trop lourde (max 10 Mo avant compression)");
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      toast.error(`Limite atteinte : ${MAX_PHOTOS} photos maximum par compagnie`);
      return;
    }
    e.target.value = "";
    setCompressing(true);
    setCompressionInfo(null);
    try {
      const result = await compressImage(file);
      setCompressionInfo({ original: result.originalSize, compressed: result.compressedSize });
      setPendingFile({ base64: result.dataUrl, mimeType: "image/jpeg" });
    } catch {
      toast.error("Impossible de traiter cette image");
    } finally {
      setCompressing(false);
    }
  }

  function handleUpload() {
    if (!pendingFile) return;
    setUploading(true);
    uploadPhoto.mutate({
      base64: pendingFile.base64,
      mimeType: pendingFile.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
      caption: pendingCaption,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-[#E8751A]" />
          <h3 className="text-lg font-semibold text-gray-900">Bibliothèque photos</h3>
          <span className="text-sm text-gray-400">
            ({photos.length} photo{photos.length !== 1 ? "s" : ""})
          </span>
          {photos.length > 1 && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <GripVertical className="h-3 w-3" />
              Glissez pour réordonner
            </span>
          )}
        </div>
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#E8751A] hover:bg-[#C96020] text-white gap-2"
          disabled={uploading || compressing}
        >
          {compressing ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Compression...</>
          ) : (
            <><ImagePlus className="h-4 w-4" />Ajouter une photo</>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Aperçu avant upload */}
      {pendingFile && (
        <Card className="border-[#E8751A]/30 bg-orange-50/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Aperçu — ajoutez une légende avant de publier
            </p>
            {compressionInfo && (
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                <span className="text-green-600 font-medium">✓ Compressée</span>
                <span>{formatFileSize(compressionInfo.original)}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-green-700">{formatFileSize(compressionInfo.compressed)}</span>
                {compressionInfo.original > compressionInfo.compressed && (
                  <span className="text-green-600">
                    (-{Math.round((1 - compressionInfo.compressed / compressionInfo.original) * 100)}%)
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-4 items-start">
              <img
                src={pendingFile.base64}
                alt="Aperçu"
                className="w-32 h-24 object-cover rounded-lg border shadow-sm flex-shrink-0"
              />
              <div className="flex-1 space-y-3">
                <Input
                  value={pendingCaption}
                  onChange={(e) => setPendingCaption(e.target.value)}
                  placeholder="Légende (optionnelle) — ex : Notre agence de Bouaké"
                  maxLength={300}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="bg-[#E8751A] hover:bg-[#C96020] text-white gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Publication...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Publier
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setPendingFile(null)} disabled={uploading}>
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grille de photos avec DnD */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Chargement...
        </div>
      ) : photos.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-[#E8751A]/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Images className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune photo dans votre bibliothèque</p>
          <p className="text-sm text-gray-400 mt-1">
            Cliquez ici ou sur "Ajouter une photo" pour commencer à enrichir votre vitrine publique.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  onEdit={(p) => {
                    setEditingId(p.id);
                    setEditCaption(p.caption ?? "");
                  }}
                  onDelete={(id) => deletePhoto.mutate({ photoId: id })}
                  onLightbox={setLightboxPhoto}
                  editingId={editingId}
                  editCaption={editCaption}
                  setEditCaption={setEditCaption}
                  onSaveEdit={(id) => updateCaption.mutate({ photoId: id, caption: editCaption })}
                  onCancelEdit={() => setEditingId(null)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="px-4 pt-2">
            <DialogTitle className="text-sm font-medium text-gray-700">
              {lightboxPhoto?.caption || "Photo"}
            </DialogTitle>
          </DialogHeader>
          {lightboxPhoto && (
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption ?? "Photo"}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
