import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Images, Plus, Trash2, Loader2 } from "lucide-react";

interface GalleryManagerProps {
  companyId: number;
}

export function GalleryManager({ companyId }: GalleryManagerProps) {
  const [newUrl, setNewUrl] = useState("");
  const [newCaption, setNewCaption] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const utils = trpc.useUtils();
  const { data: images = [], isLoading } = trpc.transport.public.gallery.useQuery({ companyId });

  const addMutation = trpc.transport.public.addGalleryImage.useMutation({
    onSuccess: () => {
      utils.transport.public.gallery.invalidate({ companyId });
      setNewUrl("");
      setNewCaption("");
      setIsAdding(false);
    },
    onError: (e) => console.error(e.message),
  });

  const deleteMutation = trpc.transport.public.deleteGalleryImage.useMutation({
    onSuccess: () => {
      utils.transport.public.gallery.invalidate({ companyId });
    },
    onError: (e) => console.error(e.message),
  });

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    addMutation.mutate({ imageUrl: newUrl.trim(), caption: newCaption.trim() || undefined });
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-[#E8751A]" />
            Galerie d'images
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        </CardTitle>
        <p className="text-xs text-gray-500">
          Ces images seront visibles dans le répertoire public NEXUS.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        {isAdding && (
          <div className="space-y-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div>
              <Label className="text-xs">URL de l'image *</Label>
              <Input
                placeholder="https://..."
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Légende (optionnel)</Label>
              <Input
                placeholder="Description de l'image..."
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-7 text-xs bg-[#E8751A] hover:bg-[#C96020] text-white"
                onClick={handleAdd}
                disabled={addMutation.isPending || !newUrl.trim()}
              >
                {addMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ajouter"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setIsAdding(false)}>
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Images grid */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <Images className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-xs">Aucune image dans la galerie</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {(images as any[]).map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border aspect-square">
                <img src={img.imageUrl} alt={img.caption ?? ""} className="w-full h-full object-cover" />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate">
                    {img.caption}
                  </div>
                )}
                <button
                  onClick={() => deleteMutation.mutate({ imageId: img.id })}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400">{images.length} image{images.length !== 1 ? "s" : ""} dans la galerie</p>
      </CardContent>
    </Card>
  );
}
