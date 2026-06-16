import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Users,
  Shield,
  ShieldOff,
  Key,
  Trash2,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ROLE_LABELS: Record<string, string> = {
  gerant: "Gérant",
  caissier: "Caissier",
  employe: "Employé",
};

const ROLE_COLORS: Record<string, string> = {
  gerant: "bg-orange-100 text-orange-800 border-orange-200",
  caissier: "bg-blue-100 text-blue-800 border-blue-200",
  employe: "bg-gray-100 text-gray-800 border-gray-200",
};

type Member = {
  id: number;
  companyId: number;
  userId: number | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  role: "gerant" | "caissier" | "employe";
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export default function TeamManager() {
  const utils = trpc.useUtils();
  const { data: members = [], isLoading } = trpc.team.listMembers.useQuery();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "caissier" as "caissier" | "employe",
    pin: "",
    confirmPin: "",
  });
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");

  const addMember = trpc.team.addMember.useMutation({
    onSuccess: () => {
      toast.success("Membre ajouté à l'équipe");
      utils.team.listMembers.invalidate();
      setShowAddDialog(false);
      setForm({ firstName: "", lastName: "", phone: "", email: "", role: "caissier", pin: "", confirmPin: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMember = trpc.team.updateMember.useMutation({
    onSuccess: () => {
      toast.success("Statut du membre modifié");
      utils.team.listMembers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetPin = trpc.team.resetPin.useMutation({
    onSuccess: () => {
      toast.success("PIN réinitialisé avec succès");
      setShowPinDialog(false);
      setNewPin("");
      setConfirmNewPin("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMember = trpc.team.deleteMember.useMutation({
    onSuccess: () => {
      toast.success("Membre retiré de l'équipe");
      utils.team.listMembers.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleAdd() {
    if (!form.firstName || !form.lastName || !form.pin) {
      toast.error("Prénom, nom et PIN sont obligatoires.");
      return;
    }
    if (form.pin !== form.confirmPin) {
      toast.error("Les deux PIN ne correspondent pas.");
      return;
    }
    addMember.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
      email: form.email || undefined,
      role: form.role,
      pin: form.pin,
    });
  }

  function handleResetPin() {
    if (!selectedMember) return;
    if (newPin !== confirmNewPin) {
      toast.error("Les deux PIN ne correspondent pas.");
      return;
    }
    resetPin.mutate({ memberId: selectedMember.id, newPin });
  }

  function handleToggleActive(member: Member) {
    updateMember.mutate({ memberId: member.id, isActive: !member.isActive });
  }

  function handleDelete(member: Member) {
    if (!confirm(`Supprimer ${member.firstName} ${member.lastName} de l'équipe ?`)) return;
    deleteMember.mutate({ memberId: member.id });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-[#E8751A]" />
            Gestion de l'équipe
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gérez les membres de votre équipe et leurs accès
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-[#E8751A] hover:bg-[#C96020] text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un membre
        </Button>
      </div>

      {/* Role legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <div key={role} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[role]}`}>
            <Shield className="h-3 w-3" />
            {label}
          </div>
        ))}
      </div>

      {/* Members list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : members.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Aucun membre dans l'équipe</h3>
            <p className="text-sm text-gray-500 mb-4">
              Ajoutez des caissiers ou employés pour leur donner accès au dashboard.
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-[#E8751A] hover:bg-[#C96020] text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter le premier membre
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(members as Member[]).map((member) => (
            <Card key={member.id} className={`relative ${!member.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#E8751A]/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-[#E8751A]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {member.firstName} {member.lastName}
                      </p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[member.role]}`}>
                        <Shield className="h-2.5 w-2.5" />
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {member.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1 mb-3">
                  {member.phone && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="h-3 w-3" />
                      {member.phone}
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                  )}
                  {member.lastLoginAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      Dernière connexion : {format(new Date(member.lastLoginAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => {
                      setSelectedMember(member);
                      setShowPinDialog(true);
                    }}
                  >
                    <Key className="h-3 w-3 mr-1" />
                    PIN
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`flex-1 text-xs ${member.isActive ? "text-orange-600 hover:bg-orange-50" : "text-green-600 hover:bg-green-50"}`}
                    onClick={() => handleToggleActive(member)}
                    disabled={updateMember.isPending}
                  >
                    {member.isActive ? (
                      <><ShieldOff className="h-3 w-3 mr-1" />Désactiver</>
                    ) : (
                      <><Shield className="h-3 w-3 mr-1" />Activer</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleDelete(member)}
                    disabled={deleteMember.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Permissions summary */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Niveaux d'accès par rôle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="font-semibold text-orange-700 mb-1">Gérant (vous)</p>
              <ul className="text-gray-600 space-y-0.5">
                <li>✓ Tous les modules</li>
                <li>✓ Modifier les tarifs</li>
                <li>✓ Gérer l'équipe</li>
                <li>✓ Paramètres compagnie</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-blue-700 mb-1">Caissier</p>
              <ul className="text-gray-600 space-y-0.5">
                <li>✓ Vente de billets</li>
                <li>✓ Enregistrement colis</li>
                <li>✓ Commandes restaurant</li>
                <li>✗ Tarifs & paramètres</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-1">Employé</p>
              <ul className="text-gray-600 space-y-0.5">
                <li>✓ Consultation</li>
                <li>✓ Commandes restaurant</li>
                <li>✗ Vente & encaissement</li>
                <li>✗ Tarifs & paramètres</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add member dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#E8751A]" />
              Ajouter un membre
            </DialogTitle>
            <DialogDescription>
              Créez un compte pour un caissier ou employé avec un PIN d'accès sécurisé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prénom *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Jean"
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Koné"
                />
              </div>
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+225 0700000000"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jean.kone@email.com"
              />
            </div>
            <div>
              <Label>Rôle *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as "caissier" | "employe" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caissier">Caissier</SelectItem>
                  <SelectItem value="employe">Employé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>PIN (4 chiffres) *</Label>
                <Input
                  type="password"
                  maxLength={4}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <div>
                <Label>Confirmer le PIN *</Label>
                <Input
                  type="password"
                  maxLength={4}
                  value={form.confirmPin}
                  onChange={(e) => setForm({ ...form, confirmPin: e.target.value.replace(/\D/g, "") })}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addMember.isPending}
              className="bg-[#E8751A] hover:bg-[#C96020] text-white"
            >
              {addMember.isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset PIN dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-[#E8751A]" />
              Réinitialiser le PIN
            </DialogTitle>
            <DialogDescription>
              {selectedMember && `Nouveau PIN pour ${selectedMember.firstName} ${selectedMember.lastName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nouveau PIN (4 chiffres)</Label>
              <Input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <div>
              <Label>Confirmer le nouveau PIN</Label>
              <Input
                type="password"
                maxLength={4}
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPinDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleResetPin}
              disabled={resetPin.isPending || newPin.length !== 4}
              className="bg-[#E8751A] hover:bg-[#C96020] text-white"
            >
              {resetPin.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
