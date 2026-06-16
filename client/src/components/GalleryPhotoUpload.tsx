import { useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Photo {
  file: File;
  preview: string;
}

interface GalleryPhotoUploadProps {
  photos: Photo[];
  coverPhotoIndex: number | null;
  onPhotosChange: (photos: Photo[]) => void;
  onCoverPhotoChange: (index: number | null) => void;
}

export function GalleryPhotoUpload({
  photos,
  coverPhotoIndex,
  onPhotosChange,
  onCoverPhotoChange,
}: GalleryPhotoUploadProps) {
  const handleAddPhotos = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    onPhotosChange([...photos, ...newPhotos]);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
    if (coverPhotoIndex === index) {
      onCoverPhotoChange(null);
    } else if (coverPhotoIndex !== null && coverPhotoIndex > index) {
      onCoverPhotoChange(coverPhotoIndex - 1);
    }
  };

  return (
    <div className="border-t border-dashed border-orange-200 pt-4">
      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">
        📸 Galerie de Photos (Optionnel)
      </p>
      <div className="space-y-3">
        <Label htmlFor="photos">Ajouter des photos de votre compagnie</Label>
        <div className="relative border-2 border-dashed border-orange-300 rounded-lg p-6 hover:border-orange-500 transition-colors bg-orange-50">
          <input
            id="photos"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleAddPhotos(e.target.files)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="text-center pointer-events-none">
            <p className="text-sm font-medium text-orange-700">Cliquez ou déposez vos photos ici</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP (max 5 Mo par photo)</p>
          </div>
        </div>

        {photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">{photos.length} photo(s) sélectionnée(s)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    coverPhotoIndex === index
                      ? "border-orange-500 ring-2 ring-orange-300"
                      : "border-gray-200 hover:border-orange-300"
                  }`}
                  onClick={() => onCoverPhotoChange(index)}
                >
                  <img src={photo.preview} alt={`Photo ${index + 1}`} className="w-full h-24 object-cover" />
                  {coverPhotoIndex === index && (
                    <div className="absolute inset-0 bg-orange-500 bg-opacity-30 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Couverture</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(index);
                    }}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {coverPhotoIndex !== null && (
              <p className="text-xs text-orange-600 font-medium">
                ✓ Photo de couverture sélectionnée (affichée dans la galerie publique)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
