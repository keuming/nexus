/**
 * RecruitmentMonitor — Interface de monitoring des candidats commerciaux
 * Intégré dans le dashboard HUB_RESA (admin)
 *
 * Fonctionnalités :
 * - Liste des candidats avec filtres par statut et recherche
 * - Actions par ligne : Email, SMS, WhatsApp
 * - Changement de statut inline
 * - Notes par candidat
 * - Statistiques en haut
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Mail,
  MessageSquare,
  Phone,
  Search,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  Globe,
  GraduationCap,
  Languages,
  Trash2,
  FileText,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG = {
  nouveau: { label: "Nouveau", color: "bg-blue-100 text-blue-700 border-blue-200" },
  contacte: { label: "Contacté", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  entretien: { label: "Entretien", color: "bg-purple-100 text-purple-700 border-purple-200" },
  retenu: { label: "Retenu", color: "bg-green-100 text-green-700 border-green-200" },
  rejete: { label: "Rejeté", color: "bg-red-100 text-red-700 border-red-200" },
} as const;

const EDUCATION_LABELS: Record<string, string> = {
  brevet: "Brevet",
  bac: "Bac",
  "bac+2": "Bac+2",
  "bac+3": "Bac+3",
  "bac+4": "Bac+4",
  "bac+5": "Bac+5",
  doctorat: "Doctorat",
  autre: "Autre",
};

const LANGUAGE_LABELS: Record<string, string> = {
  francais: "🇫🇷 Français",
  espagnol: "🇪🇸 Espagnol",
  anglais: "🇬🇧 Anglais",
};

type StatusType = keyof typeof STATUS_CONFIG;

export default function RecruitmentMonitor() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusType | "all">("all");
  const [noteDialog, setNoteDialog] = useState<{ id: number; notes: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  const utils = trpc.useUtils();

  const { data: stats } = trpc.recruitment.stats.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: candidates = [], isLoading, refetch } = trpc.recruitment.list.useQuery(
    { search: search || undefined, status: statusFilter },
    { refetchInterval: 60000 }
  );

  const updateStatus = trpc.recruitment.updateStatus.useMutation({
    onSuccess: () => {
      utils.recruitment.list.invalidate();
      utils.recruitment.stats.invalidate();
      toast.success("Statut mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const addNote = trpc.recruitment.addNote.useMutation({
    onSuccess: () => {
      utils.recruitment.list.invalidate();
      setNoteDialog(null);
      toast.success("Note enregistrée");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const deleteMutation = trpc.recruitment.delete.useMutation({
    onSuccess: () => {
      utils.recruitment.list.invalidate();
      utils.recruitment.stats.invalidate();
      toast.success("Candidat supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const handleEmail = (email: string, name: string) => {
    window.open(`mailto:${email}?subject=Programme Commercial HUB_RESA - ${name}&body=Bonjour ${name},%0D%0A%0D%0ANous avons bien reçu votre candidature pour le programme de recrutement des commerciaux HUB_RESA.%0D%0A%0D%0ACordialement,%0D%0AL'équipe HUB_RESA`, "_blank");
  };

  const handleSMS = (phone: string) => {
    window.open(`sms:${phone}?body=Bonjour, nous avons bien reçu votre candidature HUB_RESA. L'équipe HUB_RESA vous contactera prochainement.`, "_blank");
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Bonjour ${name}, nous avons bien reçu votre candidature pour le programme commercial HUB_RESA. L'équipe HUB_RESA vous contactera prochainement pour la suite du processus.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  };

  const openNoteDialog = (id: number, notes: string | null) => {
    setNoteDialog({ id, notes: notes ?? "" });
    setNoteText(notes ?? "");
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats?.total ?? 0, icon: Users, color: "text-gray-600 bg-gray-100" },
          { label: "Nouveaux", value: stats?.nouveau ?? 0, icon: Briefcase, color: "text-blue-600 bg-blue-100" },
          { label: "Contactés", value: stats?.contacte ?? 0, icon: Phone, color: "text-yellow-600 bg-yellow-100" },
          { label: "Entretiens", value: stats?.entretien ?? 0, icon: Clock, color: "text-purple-600 bg-purple-100" },
          { label: "Retenus", value: stats?.retenu ?? 0, icon: CheckCircle2, color: "text-green-600 bg-green-100" },
          { label: "Rejetés", value: stats?.rejete ?? 0, icon: XCircle, color: "text-red-600 bg-red-100" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone, ville..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusType | "all")}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()} title="Rafraîchir">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Tableau des candidats */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement des candidats...</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun candidat trouvé</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || statusFilter !== "all" ? "Essayez d'autres filtres" : "Les candidatures apparaîtront ici"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  {/* Avatar + Nom */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8751A] to-[#D06015] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {candidate.firstName[0]}{candidate.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {candidate.firstName} {candidate.lastName}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="h-3 w-3" />{candidate.email}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />{candidate.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Infos */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1">
                      <Globe className="h-3 w-3" />
                      {candidate.country} — {candidate.city}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1">
                      <GraduationCap className="h-3 w-3" />
                      {EDUCATION_LABELS[candidate.educationLevel] ?? candidate.educationLevel}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1">
                      <Languages className="h-3 w-3" />
                      {LANGUAGE_LABELS[candidate.language] ?? candidate.language}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(candidate.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                {/* Note */}
                {candidate.notes && (
                  <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800">
                    <span className="font-semibold">Note : </span>{candidate.notes}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-gray-50">
                  {/* Statut */}
                  <Select
                    value={candidate.status}
                    onValueChange={(v) =>
                      updateStatus.mutate({ id: candidate.id, status: v as StatusType })
                    }
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k} className="text-xs">
                          {v.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Badge className={`text-xs border ${STATUS_CONFIG[candidate.status as StatusType]?.color ?? "bg-gray-100 text-gray-600"}`} variant="outline">
                    {STATUS_CONFIG[candidate.status as StatusType]?.label ?? candidate.status}
                  </Badge>

                  <div className="flex-1" />

                  {/* Boutons d'action */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => handleEmail(candidate.email, `${candidate.firstName} ${candidate.lastName}`)}
                    title="Envoyer un email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-gray-600 border-gray-200 hover:bg-gray-50"
                    onClick={() => handleSMS(candidate.phone)}
                    title="Envoyer un SMS"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    SMS
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleWhatsApp(candidate.phone, candidate.firstName)}
                    title="Envoyer via WhatsApp"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                    onClick={() => openNoteDialog(candidate.id, candidate.notes)}
                    title="Ajouter une note"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Note
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5 text-xs text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`Supprimer la candidature de ${candidate.firstName} ${candidate.lastName} ?`)) {
                        deleteMutation.mutate({ id: candidate.id });
                      }
                    }}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog Note */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter / modifier une note</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Observations, remarques sur le candidat..."
            rows={5}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Annuler</Button>
            <Button
              className="bg-[#E8751A] hover:bg-[#D06015] text-white"
              onClick={() => noteDialog && addNote.mutate({ id: noteDialog.id, notes: noteText })}
              disabled={addNote.isPending}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
