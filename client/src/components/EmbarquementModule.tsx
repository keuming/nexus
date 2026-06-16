/**
 * Embarquement (Boarding) Module Component
 * Simplified passenger boarding management
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Circle, Users, Percent } from "lucide-react";
import { toast } from "sonner";

interface EmbarquementModuleProps {
  companyId: number;
  departures: any[];
}

export default function EmbarquementModule({ companyId, departures }: EmbarquementModuleProps) {
  const [selectedDepartureId, setSelectedDepartureId] = useState<number | null>(
    departures && departures.length > 0 ? departures[0].id : null
  );

  // Queries with real-time updates
  const boardingStatus = trpc.management.embarquement.getBoardingStatus.useQuery(
    { departureId: selectedDepartureId ?? 0 },
    { 
      enabled: !!selectedDepartureId,
      refetchInterval: 3000, // Refresh every 3 seconds for real-time updates
      staleTime: 1000, // Data is considered stale after 1 second
    }
  );

  const passengersList = trpc.management.embarquement.getPassengersList.useQuery(
    { departureId: selectedDepartureId ?? 0 },
    { 
      enabled: !!selectedDepartureId,
      refetchInterval: 5000, // Refresh every 5 seconds
      staleTime: 2000,
    }
  );

  // Mutations
  const updateBoardingMutation = trpc.management.embarquement.updateBoardingStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut d'embarquement mis à jour");
      boardingStatus.refetch();
      passengersList.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleToggleBoarding = (ticketId: number, currentStatus: string) => {
    const newStatus = currentStatus === "embarque" ? "non_embarque" : "embarque";
    updateBoardingMutation.mutate({
      ticketId,
      boardingStatus: newStatus as any,
    });
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

      {/* Boarding Status Summary */}
      {selectedDepartureId && boardingStatus.data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Passagers</p>
                  <p className="text-2xl font-bold text-gray-900">{boardingStatus.data.totalTickets}</p>
                </div>
                <Users className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Embarqués</p>
                  <p className="text-2xl font-bold text-green-600">{boardingStatus.data.boarded}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Non embarqués</p>
                  <p className="text-2xl font-bold text-orange-600">{boardingStatus.data.notBoarded}</p>
                </div>
                <Circle className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">% Embarquement</p>
                  <p className="text-2xl font-bold text-blue-600 mb-2">{boardingStatus.data.boardingPercentage}%</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-500" 
                      style={{ width: `${boardingStatus.data.boardingPercentage}%` }}
                    />
                  </div>
                </div>
                <Percent className="h-5 w-5 text-blue-500 ml-3" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Passengers List */}
      {selectedDepartureId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Liste des passagers - {selectedDeparture?.departureCity} → {selectedDeparture?.arrivalCity}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {passengersList.isLoading ? (
              <p className="text-center text-gray-400 py-8">Chargement...</p>
            ) : (passengersList.data ?? []).length === 0 ? (
              <p className="text-center text-gray-400 py-8">Aucun passager pour ce départ</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Siège</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Passager</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pièce d'ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nationalité</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(passengersList.data ?? []).map((passenger) => (
                      <tr key={passenger.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2 font-bold text-center text-lg text-orange-600">
                          {passenger.seatNumber}
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <p className="font-medium">{passenger.firstName} {passenger.lastName}</p>
                            <p className="text-xs text-gray-500">{passenger.ticketNumber}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          {passenger.idType}: {passenger.idNumber}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{passenger.nationality || "—"}</td>
                        <td className="px-3 py-2">
                          <Badge
                            className={
                              passenger.boardingStatus === "embarque"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {passenger.boardingStatus === "embarque" ? "Embarqué" : "Non embarqué"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button
                            size="sm"
                            variant={passenger.boardingStatus === "embarque" ? "default" : "outline"}
                            className="h-7 text-xs"
                            onClick={() => handleToggleBoarding(passenger.id, passenger.boardingStatus)}
                            disabled={updateBoardingMutation.isPending}
                          >
                            {passenger.boardingStatus === "embarque" ? "✓ Embarqué" : "Embarquer"}
                          </Button>
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
