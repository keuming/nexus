import express from "express";
import multer from "multer";
import { sdk } from "./_core/sdk";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { roomPhotos, rooms, hotelProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const router = express.Router();

// Memory storage — files are kept in RAM as Buffer before S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Seules les images sont acceptées"));
    }
  },
});

/** Middleware: authenticate request and attach user to req */
async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) return res.status(401).json({ error: "Non autorisé" });
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Non autorisé" });
  }
}

/**
 * POST /api/rooms/:roomId/photos
 * Upload one or more photos for a room.
 * Requires authentication — the room must belong to the logged-in user's hotel profile.
 */
router.post(
  "/api/rooms/:roomId/photos",
  requireAuth,
  upload.array("photos", 20),
  async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const user = (req as any).user;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "Aucun fichier reçu" });
      }

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB indisponible" });

      // Verify the room exists
      const roomRows = await db
        .select({ id: rooms.id })
        .from(rooms)
        .where(eq(rooms.id, roomId))
        .limit(1);

      if (!roomRows.length) {
        return res.status(404).json({ error: "Chambre introuvable" });
      }

      // Verify the user has a hotel profile (any registered hotel manager can upload)
      const profileRows = await db
        .select({ id: hotelProfiles.id })
        .from(hotelProfiles)
        .where(eq(hotelProfiles.userId, user.id))
        .limit(1);

      if (!profileRows.length) {
        return res.status(403).json({ error: "Profil hôtel requis" });
      }

      // Get current max sortOrder
      const existingPhotos = await db
        .select({ sortOrder: roomPhotos.sortOrder })
        .from(roomPhotos)
        .where(eq(roomPhotos.roomId, roomId));
      const maxOrder = existingPhotos.reduce((m, p) => Math.max(m, p.sortOrder), -1);

      const uploaded: { id: number; url: string; fileKey: string }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.originalname.split(".").pop() ?? "jpg";
        const fileKey = `room-photos/${roomId}/${nanoid(12)}.${ext}`;

        const { url } = await storagePut(fileKey, file.buffer, file.mimetype);

        const [result] = await db.insert(roomPhotos).values({
          roomId,
          url,
          fileKey,
          caption: null,
          sortOrder: maxOrder + 1 + i,
        });

        uploaded.push({ id: (result as any).insertId, url, fileKey });
      }

      return res.json({ success: true, photos: uploaded });
    } catch (err: any) {
      console.error("[Upload] Error:", err);
      return res.status(500).json({ error: err.message ?? "Erreur serveur" });
    }
  }
);

/**
 * DELETE /api/room-photos/:photoId
 * Delete a single room photo.
 */
router.delete("/api/room-photos/:photoId", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const photoId = parseInt(req.params.photoId);
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "DB indisponible" });

    // Verify photo exists
    const photoRows = await db
      .select({ id: roomPhotos.id, roomId: roomPhotos.roomId })
      .from(roomPhotos)
      .where(eq(roomPhotos.id, photoId))
      .limit(1);

    if (!photoRows.length) return res.status(404).json({ error: "Photo introuvable" });

    // Verify user has a hotel profile
    const profileRows = await db
      .select({ id: hotelProfiles.id })
      .from(hotelProfiles)
      .where(eq(hotelProfiles.userId, user.id))
      .limit(1);

    if (!profileRows.length) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    await db.delete(roomPhotos).where(eq(roomPhotos.id, photoId));
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;

// ── Upload de documents de candidature (CV / Lettre de motivation) ──────────
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Seuls les fichiers PDF et Word sont acceptés"));
    }
  },
});

/**
 * POST /api/recruitment/upload-document
 * Upload un CV ou une lettre de motivation (public, sans auth)
 * Body: multipart/form-data avec champ "document" et query param "type" (cv|cover_letter)
 */
router.post(
  "/api/recruitment/upload-document",
  documentUpload.single("document"),
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "Aucun fichier reçu" });
      }
      const docType = (req.query.type as string) === "cover_letter" ? "cover-letter" : "cv";
      const ext = file.originalname.split(".").pop() ?? "pdf";
      const key = `recruitment/${docType}/${nanoid(12)}.${ext}`;
      const { url } = await storagePut(key, file.buffer, file.mimetype);
      return res.json({ success: true, url, key });
    } catch (err: any) {
      console.error("[UploadDocument]", err);
      return res.status(500).json({ error: err.message ?? "Erreur upload" });
    }
  }
);
