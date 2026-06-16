/**
 * TicketPrintModal
 * Affiche un billet imprimable avec QR code et permet l'impression navigateur
 */

import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  Bus,
  Calendar,
  Clock,
  Download,
  MapPin,
  Printer,
  Ticket,
  User,
} from "lucide-react";

interface TicketPrintModalProps {
  ticketId: number;
  onClose: () => void;
}

export default function TicketPrintModal({ ticketId, onClose }: TicketPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading } = trpc.transport.company.tickets.list.useQuery(
    { limit: 200 },
    {
      select: (tickets) => tickets.find((t) => t.id === ticketId),
    }
  );

  function handlePrint() {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Billet ${ticket?.ticketNumber ?? ""}</title>
          <meta charset="UTF-8" />
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; background: white; }
            .ticket-wrapper { max-width: 600px; margin: 20px auto; }
          </style>
        </head>
        <body>
          <div class="ticket-wrapper">${printContent}</div>
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    win.document.close();
  }

  const qrData = ticket
    ? JSON.stringify({
        ticketNumber: ticket.ticketNumber,
        passenger: `${ticket.firstName} ${ticket.lastName}`,
        seat: ticket.seatNumber,
        departureId: ticket.departureId,
      })
    : "";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Ticket className="h-5 w-5" />
            Billet de voyage
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent" />
          </div>
        )}

        {!isLoading && !ticket && (
          <div className="text-center py-8 text-gray-400">Billet introuvable</div>
        )}

        {ticket && (
          <>
            {/* Zone imprimable */}
            <div ref={printRef}>
              <TicketCard ticket={ticket} qrData={qrData} />
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Fermer
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Composant carte billet (réutilisable pour l'impression) ──────────────────
function TicketCard({
  ticket,
  qrData,
}: {
  ticket: {
    ticketNumber: string;
    firstName: string;
    lastName: string;
    seatNumber: number;
    departureId: number;
    priceXOF?: string | number | null;
    paymentMethod?: string | null;
    idType?: string | null;
    idNumber?: string | null;
    gender?: string | null;
    nationality?: string | null;
    ticketStatus?: string;
    cashStatus?: string;
    createdAt?: Date | string;
  };
  qrData: string;
}) {
  type DepartureItem = {
    id: number;
    departureCity?: string;
    arrivalCity?: string;
    departureDate?: Date | string;
    departureTime?: string;
    [key: string]: unknown;
  };
  const { data: departureList } = trpc.transport.company.departures.list.useQuery();
  const departure = (departureList as unknown as DepartureItem[] | undefined)?.find(
    (d) => d.id === ticket.departureId
  );

  const statusColors: Record<string, string> = {
    actif: "bg-green-100 text-green-700 border-green-200",
    utilise: "bg-gray-100 text-gray-600 border-gray-200",
    annule: "bg-red-100 text-red-700 border-red-200",
  };

  const cashColors: Record<string, string> = {
    encaisse: "bg-emerald-100 text-emerald-700",
    en_attente: "bg-amber-100 text-amber-700",
  };

  return (
    <div
      style={{
        border: "2px solid #E8751A",
        borderRadius: "16px",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
        background: "white",
      }}
    >
      {/* En-tête */}
      <div
        style={{
          background: "linear-gradient(135deg, #E8751A 0%, #B8501A 100%)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Bus style={{ color: "white", width: "24px", height: "24px" }} />
          <div>
            <p style={{ color: "white", fontWeight: "bold", fontSize: "16px", margin: 0 }}>
              HUB RESA
            </p>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", margin: 0 }}>
              Billet de voyage officiel
            </p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", margin: 0 }}>N° Billet</p>
          <p style={{ color: "white", fontWeight: "bold", fontSize: "14px", fontFamily: "monospace", margin: 0 }}>
            {ticket.ticketNumber}
          </p>
        </div>
      </div>

      {/* Corps */}
      <div style={{ padding: "20px", display: "flex", gap: "20px" }}>
        {/* Infos trajet + passager */}
        <div style={{ flex: 1 }}>
          {/* Trajet */}
          {departure && (
            <div
              style={{
                background: "#FFF7ED",
                borderRadius: "10px",
                padding: "12px",
                marginBottom: "12px",
                border: "1px solid #FED7AA",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#B8501A",
                  fontWeight: "bold",
                  fontSize: "15px",
                }}
              >
                <MapPin style={{ width: "14px", height: "14px" }} />
                {departure.departureCity}
                <ArrowRight style={{ width: "14px", height: "14px" }} />
                {departure.arrivalCity}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  marginTop: "6px",
                  fontSize: "12px",
                  color: "#E8751A",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar style={{ width: "12px", height: "12px" }} />
                  {departure.departureDate instanceof Date
                    ? departure.departureDate.toLocaleDateString("fr-FR")
                    : String(departure.departureDate)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Clock style={{ width: "12px", height: "12px" }} />
                  {departure.departureTime}
                </span>
              </div>
            </div>
          )}

          {/* Passager */}
          <div style={{ marginBottom: "10px" }}>
            <p
              style={{
                fontSize: "10px",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "2px",
              }}
            >
              Passager
            </p>
            <p style={{ fontWeight: "bold", fontSize: "16px", color: "#111827" }}>
              {ticket.firstName} {ticket.lastName}
            </p>
            {ticket.idType && ticket.idNumber && (
              <p style={{ fontSize: "12px", color: "#6B7280" }}>
                {ticket.idType.toUpperCase()} : {ticket.idNumber}
              </p>
            )}
            {ticket.nationality && (
              <p style={{ fontSize: "12px", color: "#6B7280" }}>
                Nationalité : {ticket.nationality}
              </p>
            )}
          </div>

          {/* Siège + Prix */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div
              style={{
                background: "#E8751A",
                color: "white",
                borderRadius: "8px",
                padding: "8px 16px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "10px", margin: 0 }}>SIÈGE</p>
              <p style={{ fontSize: "22px", fontWeight: "bold", margin: 0 }}>
                {ticket.seatNumber}
              </p>
            </div>
            {ticket.priceXOF && (
              <div
                style={{
                  background: "#F0FDF4",
                  border: "1px solid #BBF7D0",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "10px", color: "#6B7280", margin: 0 }}>PRIX</p>
                <p style={{ fontSize: "16px", fontWeight: "bold", color: "#16A34A", margin: 0 }}>
                  {Number(ticket.priceXOF).toLocaleString()} XOF
                </p>
              </div>
            )}
          </div>

          {/* Statuts */}
          <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
            {ticket.ticketStatus && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: ticket.ticketStatus === "actif" ? "#DCFCE7" : "#F3F4F6",
                  color: ticket.ticketStatus === "actif" ? "#16A34A" : "#6B7280",
                  border: "1px solid",
                  borderColor: ticket.ticketStatus === "actif" ? "#BBF7D0" : "#E5E7EB",
                }}
              >
                {ticket.ticketStatus === "actif" ? "✓ Actif" : ticket.ticketStatus}
              </span>
            )}
            {ticket.cashStatus && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  background: ticket.cashStatus === "encaisse" ? "#ECFDF5" : "#FFFBEB",
                  color: ticket.cashStatus === "encaisse" ? "#059669" : "#D97706",
                }}
              >
                {ticket.cashStatus === "encaisse" ? "💰 Encaissé" : "⏳ En attente"}
              </span>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "8px",
              border: "2px solid #E8751A",
              borderRadius: "10px",
              background: "white",
            }}
          >
            <QRCodeSVG value={qrData || ticket.ticketNumber} size={100} />
          </div>
          <p style={{ fontSize: "9px", color: "#9CA3AF", textAlign: "center" }}>
            Scanner pour vérifier
          </p>
        </div>
      </div>

      {/* Pied de page */}
      <div
        style={{
          borderTop: "1px dashed #FED7AA",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#FFFBF5",
        }}
      >
        <p style={{ fontSize: "10px", color: "#9CA3AF" }}>
          Émis le{" "}
          {ticket.createdAt
            ? new Date(ticket.createdAt).toLocaleString("fr-FR")
            : "—"}
        </p>
        <p style={{ fontSize: "10px", color: "#9CA3AF" }}>
          Paiement : {ticket.paymentMethod ?? "—"}
        </p>
      </div>
    </div>
  );
}
