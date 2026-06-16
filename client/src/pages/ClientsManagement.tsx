import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  ToggleLeft,
  ToggleRight,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

export default function ClientsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Récupérer la liste des clients avec lazy loading
  const { data: clients = [], isLoading, refetch } = trpc.clientAuth.listClients.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache pour 5 minutes
  });

  // Mutation pour activer/désactiver un client
  const toggleClientStatus = trpc.clientAuth.toggleClientStatus.useMutation({
    onSuccess: () => {
      toast.success("Statut du client mis à jour");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Filtrer les clients par nom ou email
  const filteredClients = clients.filter((client) =>
    (client.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (client.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleToggleStatus = (clientId: number, currentStatus: boolean) => {
    toggleClientStatus.mutate({ clientId, isActive: !currentStatus });
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "N/A";
    const d = new Date(date);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Clients</h2>
        <p className="text-sm text-gray-600 mt-1">Affichage et gestion des comptes clients</p>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des clients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des Clients ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun client trouvé</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Dernier Login</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Mail className="h-3.5 w-3.5" />
                          {client.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Phone className="h-3.5 w-3.5" />
                          {client.phone || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3.5 w-3.5" />
                          {client.city || "N/A"}, {client.country || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(client.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="h-3.5 w-3.5" />
                          {client.lastLoginAt ? formatTime(client.lastLoginAt) : "Jamais"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={client.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {client.isActive ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setSelectedClient(client);
                              setShowDetails(true);
                            }}
                            size="sm"
                            variant="outline"
                            className="text-xs gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Détails
                          </Button>
                          <Button
                            onClick={() => handleToggleStatus(client.id, client.isActive)}
                            size="sm"
                            variant={client.isActive ? "destructive" : "default"}
                            className="text-xs gap-1"
                            disabled={toggleClientStatus.isPending}
                          >
                            {client.isActive ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" />
                                Activer
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Détails Client */}
      {selectedClient && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du Client - {selectedClient.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-semibold">Nom</p>
                <p className="text-sm font-medium">{selectedClient.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Email</p>
                <p className="text-sm font-medium">{selectedClient.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Téléphone</p>
                <p className="text-sm font-medium">{selectedClient.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Pays</p>
                <p className="text-sm font-medium">{selectedClient.country || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Ville</p>
                <p className="text-sm font-medium">{selectedClient.city || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Statut</p>
                <Badge className={selectedClient.isActive ? "bg-green-100 text-green-800 w-fit" : "bg-red-100 text-red-800 w-fit"}>
                  {selectedClient.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Date d'inscription</p>
                <p className="text-sm font-medium">{formatDate(selectedClient.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold">Dernier login</p>
                <p className="text-sm font-medium">{selectedClient.lastLoginAt ? formatTime(selectedClient.lastLoginAt) : "Jamais"}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-sm mb-3">Réservations</h3>
              <ClientBookingsList clientId={selectedClient.id} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ClientBookingsList({ clientId }: { clientId: number }) {
  const { data: bookings, isLoading } = trpc.clientAuth.getClientBookings.useQuery({ clientId });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  if (!bookings || bookings.length === 0) {
    return <div className="text-sm text-gray-500">Aucune réservation</div>;
  }

  return (
    <div className="space-y-2">
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-gray-50 p-3 rounded-lg text-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{booking.service}</p>
              <p className="text-xs text-gray-600">{booking.companyName}</p>
            </div>
            <Badge className={getStatusBadgeClass(booking.status)}>
              {booking.status}
            </Badge>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            <p>Coût: {booking.cost} FCFA</p>
            <p>Date: {new Date(booking.bookingDate).toLocaleDateString("fr-FR")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusBadgeClass(status: string) {
  const classes: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}
