import { z } from "zod";
import { eq } from "drizzle-orm";
import { reservations } from "../../drizzle/schema";
import { getDb } from "../db";
import { publicProcedure, router } from "../_core/trpc";

export const hotelRouter = router({
  createReservation: publicProcedure
    .input(
      z.object({
        hotelId: z.number(),
        roomId: z.number(),
        clientName: z.string().min(1),
        clientPhone: z.string().min(1),
        clientEmail: z.string().email().optional(),
        checkInDate: z.string(),
        checkOutDate: z.string(),
        numberOfNights: z.number().min(1),
        numberOfRooms: z.number().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Erreur de connexion" };

      try {
        // Générer une référence unique
        const reference = `RES-${Date.now()}`;

        // Calculer le montant total (prix par nuit * nombre de nuits * nombre de chambres)
        // Pour cet exemple, on utilise un prix fixe de 50 000 FCFA par nuit
        const pricePerNight = 50000;
        const totalAmount = (pricePerNight * input.numberOfNights * input.numberOfRooms).toString();

        // Créer la réservation
        const result = await db.insert(reservations).values({
          reference,
          clientId: 0, // À remplacer par l'ID du client authentifié
          roomId: input.roomId,
          checkInDate: new Date(input.checkInDate),
          checkOutDate: new Date(input.checkOutDate),
          adults: 1,
          children: 0,
          status: "confirmee",
          totalAmount: totalAmount as any,
          paidAmount: "0",
          source: "direct",
          notes: `Réservation pour ${input.clientName} - ${input.numberOfRooms} chambre(s)`,
          createdBy: 0,
        });

        return {
          success: true,
          reservationNumber: reference,
          totalAmount: totalAmount,
          message: "Réservation confirmée",
        };
      } catch (error) {
        console.error("Erreur lors de la création de la réservation:", error);
        return {
          success: false,
          error: "Erreur lors de la création de la réservation",
        };
      }
    }),
});
