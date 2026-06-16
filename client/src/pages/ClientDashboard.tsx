import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  LogOut,
  Edit2,
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock3,
} from "lucide-react";
import { toast } from "sonner";

export default function ClientDashboard() {
  const [, navigate] = useLocation();
  const [editMode, setEditMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    country: "",
    city: "",
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Récupérer le profil du client
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.clientAuth.getProfile.useQuery();

  // Récupérer les réservations du client
  const { data: bookings, isLoading: bookingsLoading } = trpc.clientAuth.getBookings.useQuery();

  // Mutations
  const updateProfile = trpc.clientAuth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil mis à jour");
      setEditMode(false);
      refetchProfile();
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const changePassword = trpc.clientAuth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Mot de passe changé");
      setShowPasswordDialog(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const logout = trpc.clientAuth.logout.useMutation({
    onSuccess: () => {
      navigate("/");
    },
  });

  // Initialiser le formulaire avec les données du profil
  if (profile && !editMode && formData.name === "") {
    setFormData({
      name: profile.name,
      phone: profile.phone || "",
      country: profile.country || "",
      city: profile.city || "",
    });
  }

  const handleSaveProfile = () => {
    updateProfile.mutate(formData);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    changePassword.mutate({
      oldPassword: passwordData.oldPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock3 className="h-4 w-4 text-yellow-600" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      pending: "En attente",
      confirmed: "Confirmée",
      completed: "Complétée",
      cancelled: "Annulée",
    };
    return { className: classes[status] || "bg-gray-100 text-gray-800", label: labels[status] || status };
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Veuillez vous connecter pour accéder au dashboard</p>
          <Button onClick={() => navigate("/")} className="bg-orange-500 hover:bg-orange-600">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <User className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{profile.name}</h1>
              <p className="text-xs text-gray-500">{profile.email}</p>
            </div>
          </div>
          <Button
            onClick={() => logout.mutate()}
            variant="outline"
            size="sm"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Profil */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Mon Profil</CardTitle>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Edit2 className="h-4 w-4" />
              {editMode ? "Annuler" : "Modifier"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Nom</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Téléphone</label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Pays</label>
                    <Input
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700">Ville</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={updateProfile.isPending}
                  >
                    {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Enregistrer
                  </Button>
                  <Button
                    onClick={() => setShowPasswordDialog(true)}
                    variant="outline"
                  >
                    Changer le mot de passe
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Nom</p>
                    <p className="font-medium">{profile.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{profile.phone || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Localisation</p>
                    <p className="font-medium">{profile.city || "N/A"}, {profile.country || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Inscription</p>
                    <p className="font-medium">{new Date(profile.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Dernier login</p>
                    <p className="font-medium">
                      {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("fr-FR") : "Jamais"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Réservations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              Mes Réservations ({bookings?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </div>
            ) : !bookings || bookings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Aucune réservation pour le moment</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Service</TableHead>
                      <TableHead>Compagnie</TableHead>
                      <TableHead>Coût</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => {
                      const statusBadge = getStatusBadge(booking.status);
                      return (
                        <TableRow key={booking.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{booking.service}</TableCell>
                          <TableCell className="text-sm">{booking.companyName}</TableCell>
                          <TableCell className="text-sm font-medium">{booking.cost} FCFA</TableCell>
                          <TableCell className="text-sm">
                            {new Date(booking.bookingDate).toLocaleDateString("fr-FR")}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(booking.status)}
                              <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs"
                            >
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog Changer le mot de passe */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Ancien mot de passe</label>
              <Input
                type="password"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Nouveau mot de passe</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Confirmer le mot de passe</label>
              <Input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleChangePassword}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Changer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
