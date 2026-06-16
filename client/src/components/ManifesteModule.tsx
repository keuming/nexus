/**
 * Manifeste (Manifest) Module Component
 * Simplified passenger manifest for a departure
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Download, Users, UserCheck, UserX, FileDown } from "lucide-react";
import { toast } from "sonner";
import { generateManifestPDF } from "@/lib/pdf-export";

interface ManifesteModuleProps {
  companyId: number;
  departures: any[];
}

export default function ManifesteModule({ companyId, departures }: ManifesteModuleProps) {
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(
    departures && departures.length > 0 ? departures[0].id : null
  );

  // Queries with real-time updates
  const manifest = trpc.management.manifeste.getManifest.useQuery(
    { departureId: selectedDepartureId ?? 0 },
    { 
      enabled: !!selectedDepartureId,
      refetchInterval: 5000, // Refresh every 5 seconds
      staleTime: 2000,
    }
  );

  const manifestForPrint = trpc.management.manifeste.getManifestForPrint.useQuery(
    { departureId: selectedDepartureId ?? 0 },
    { 
      enabled: !!selectedDepartureId,
      refetchInterval: 10000, // Refresh every 10 seconds for print data
      staleTime: 5000,
    }
  );

  const handleExportPDF = () => {
    if (!manifestForPrint.data) {
      toast.error("Impossible de générer le PDF");
      return;
    }

    try {
      generateManifestPDF({
        company: {
          name: manifestForPrint.data.company || "HUB RESA",
        },
        departure: {
          departureCity: manifestForPrint.data.departure.departureCity,
          arrivalCity: manifestForPrint.data.departure.arrivalCity,
          departureDate: manifestForPrint.data.departure.departureDate instanceof Date ? manifestForPrint.data.departure.departureDate.toISOString().split('T')[0] : String(manifestForPrint.data.departure.departureDate),
          departureTime: manifestForPrint.data.departure.departureTime || '',
          driverName: manifestForPrint.data.departure.driverName || '',
          busNumber: (manifestForPrint.data.departure as any).busNumber,
        },
        passengers: manifestForPrint.data.passengers.map((p: any) => ({
          seatNumber: p.seatNumber,
          lastName: p.lastName,
          firstName: p.firstName,
          idType: p.idType,
          idNumber: p.idNumber,
          nationality: p.nationality,
          dropOffCity: p.dropOffCity,
          boardingStatus: p.boardingStatus,
        })),
        generatedAt: manifestForPrint.data.generatedAt,
      });
      toast.success("PDF généré avec succès");
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
      toast.error("Erreur lors de la génération du PDF");
    }
  };

  const selectedDeparture = departures?.find((d) => d.id === selectedDepartureId);

  return (
    <div className="space-y-6">
      {/* Departure Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sélectionner un départ</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedDepartureId?.toString() ?? ""}
            onValueChange={(v) => setSelectedDepartureId(parseInt(v))}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choisir un départ..." />
            </SelectTrigger>
            <SelectContent>
              {(departures ?? []).map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.departureCity} → {d.arrivalCity} • {d.departureDate instanceof Date
                    ? d.departureDate.toLocaleDateString("fr-FR")
                    : new Date(d.departureDate).toLocaleDateString("fr-FR")} {d.departureTime}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Manifest Summary */}
      {selectedDepartureId && manifest.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Passagers</p>
                  <p className="text-2xl font-bold text-gray-900">{manifest.data.totalPassengers}</p>
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hommes</p>
                  <p className="text-2xl font-bold text-blue-600">{manifest.data.maleCount}</p>
                </div>
                <UserCheck className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Femmes</p>
                  <p className="text-2xl font-bold text-pink-600">{manifest.data.femaleCount}</p>
                </div>
                <UserX className="h-5 w-5 text-pink-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Embarqués</p>
                  <p className="text-2xl font-bold text-green-600 mb-2">{manifest.data.boardedCount}</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-500" 
                      style={{ width: `${manifest.data.totalPassengers > 0 ? (manifest.data.boardedCount / manifest.data.totalPassengers) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <UserCheck className="h-5 w-5 text-green-500 ml-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Passengers Table */}
      {selectedDepartureId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Manifeste - {selectedDeparture?.departureCity} → {selectedDeparture?.arrivalCity}
              </CardTitle>
              <Button
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white h-8"
                onClick={handleExportPDF}
                disabled={manifestForPrint.isLoading}
              >
                <FileDown className="h-4 w-4 mr-1" />
                Télécharger PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {manifest.isLoading ? (
              <p className="text-center text-gray-400 py-8">Chargement...</p>
            ) : (manifest.data?.passengers ?? []).length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucun passager pour ce départ</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Siège</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Prénom</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">N° ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nationalité</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Embarqué</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(manifest.data?.passengers ?? []).map((passenger) => (
                      <tr key={passenger.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-center text-lg text-orange-600">
                          {passenger.seatNumber}
                        </td>
                        <td className="px-3 py-2 font-medium">{passenger.lastName}</td>
                        <td className="px-3 py-2">{passenger.firstName}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{passenger.idType}</td>
                        <td className="px-3 py-2 text-xs font-mono">{passenger.idNumber}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{passenger.nationality || "—"}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{passenger.dropOffCity || "—"}</td>
                        <td className="px-3 py-2">
                          <Badge
                            className={
                              passenger.boardingStatus === "embarque"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {passenger.boardingStatus === "embarque" ? "✓" : "✗"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
