/**
 * useImageCompressor — Compression d'images côté client via Canvas API
 * Réduit les images à max 1200px (côté le plus long), qualité JPEG 0.82
 * Retourne un Blob compressé + métadonnées (taille avant/après)
 */

export interface CompressionResult {
  blob: Blob;
  originalSize: number;  // octets
  compressedSize: number; // octets
  width: number;
  height: number;
  dataUrl: string;
}

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.82;

export async function compressImage(file: File): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculer les nouvelles dimensions en conservant le ratio
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      // Fond blanc pour les PNG avec transparence convertis en JPEG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
          resolve({
            blob,
            originalSize: file.size,
            compressedSize: blob.size,
            width,
            height,
            dataUrl,
          });
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };

    img.src = objectUrl;
  });
}

/** Formate une taille en octets en Ko ou Mo lisible */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
