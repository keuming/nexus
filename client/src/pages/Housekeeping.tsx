import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  BedDouble,
  CheckCircle2,
  ClipboardList,
  Clock,
  Plus,
  RefreshCw,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TASK_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  nettoyage: { label: "Nettoyage", icon: <Sparkles className="h-3.5 w-3.5" />, color: "bg-blue-100 text-blue-800" },
  recouche: { label: "Recouche", icon: <BedDouble className="h-3.5 w-3.5" />, color: "bg-purple-100 text-purple-800" },
  depart: { label: "Départ", icon: <RefreshCw className="h-3.5 w-3.5" />, color: "bg-orange-100 text-orange-800" },
  inspection: { label: "Inspection", icon: <ClipboardList className="h-3.5 w-3.5" />, color: "bg-teal-100 text-teal-800" },
  maintenance: { label: "Maintenance", icon: <Clock className="h-3.5 w-3.5" />, color: "bg-red-100 text-red-800" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  en_attente: { label: "En attente", color: "bg-amber-100 text-amber-800", icon: <Clock className="h-3 w-3" /> },
  en_cours: { label: "En cours", color: "bg-blue-100 text-blue-800", icon: <RefreshCw className="h-3 w-3" /> },
  termine: { label: "Terminé", color: "bg-emerald-100 text-emerald-800", icon: <CheckCircle2 className="h-3 w-3" /> },
  verifie: { label: "Vérifié", color: "bg-gray-100 text-gray-600", icon: <CheckCircle2 className="h-3 w-3" /> },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  basse: { label: "Basse", color: "bg-gray-100 text-gray-600" },
  normale: { label: "Normale", color: "bg-blue-100 text-blue-700" },
  haute: { label: "Haute", color: "bg-orange-100 text-orange-700" },
  urgente: { label: "Urgente", color: "bg-red-100 text-red-700" },
};

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Housekeeping() {
  const utils = trpc.useUtils();
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);

  const { data: tasks, isLoading } = trpc.housekeeping.list.useQuery({ status: filterStatus !== "all" ? filterStatus as any : undefined });
  const { data: employees } = trpc.employees.list.useQuery();

  const updateMutation = trpc.housekeeping.update.useMutation({
    onSuccess: () => { toast.success("Tâche mise à jour"); utils.housekeeping.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const housekeepingStaff = employees?.filter(e => e.role === "housekeeping" && e.status === "actif") ?? [];

  const tasksByStatus = {
    en_attente: tasks?.filter(t => t.status === "en_attente") ?? [],
    en_cours: tasks?.filter(t => t.status === "en_cours") ?? [],
    termine: tasks?.filter(t => t.status === "termine") ?? [],
    verifie: tasks?.filter(t => t.status === "verifie") ?? [],
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Housekeeping
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tasks?.length ?? 0} tâche{(tasks?.length ?? 0) > 1 ? "s" : ""} au total
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle tâche
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = tasksByStatus[key as keyof typeof tasksByStatus]?.length ?? 0;
            return (
              <Card key={key} className={`border cursor-pointer transition-all ${filterStatus === key ? "ring-2 ring-primary" : "border-border hover:shadow-sm"}`} onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${cfg.color}`}>{cfg.icon}</div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Toutes
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterStatus === key ? cfg.color + " ring-2 ring-offset-1" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Tasks */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : !tasks?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Sparkles className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-base font-medium">Aucune tâche trouvée</p>
            <Button className="mt-4" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une tâche
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => {
              const typeCfg = TASK_TYPES[task.type ?? "nettoyage"];
              const statusCfg = STATUS_CONFIG[task.status ?? "en_attente"];
              const priorityCfg = PRIORITY_CONFIG[task.priority ?? "normale"];
              return (
                <Card key={task.id} className="border border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-xs flex items-center gap-1 ${typeCfg?.color}`}>
                          {typeCfg?.icon}
                          {typeCfg?.label}
                        </Badge>
                        <Badge variant="secondary" className={`text-xs ${priorityCfg.color}`}>
                          {priorityCfg.label}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className={`text-xs flex items-center gap-1 ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <p className="font-semibold text-foreground">
                        {task.roomNumber ? `Chambre ${task.roomNumber}` : "Chambre non assignée"}
                      </p>
                      {task.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.notes}</p>}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.employeeFirstName ? `${task.employeeFirstName} ${task.employeeLastName}` : "Non assigné"}
                      </div>
                      <span>{formatDate(task.scheduledAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {task.status === "en_attente" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => updateMutation.mutate({ id: task.id, status: "en_cours" })}
                        >
                          Démarrer
                        </Button>
                      )}
                      {task.status === "en_cours" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => updateMutation.mutate({ id: task.id, status: "termine" })}
                        >
                          Terminer
                        </Button>
                      )}
                      {(task.status === "en_attente" || task.status === "en_cours") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-400 hover:text-red-600"
                          onClick={() => updateMutation.mutate({ id: task.id, status: "verifie" })}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <HousekeepingTaskModal
          staff={housekeepingStaff}
          onClose={() => setShowModal(false)}
          onSuccess={() => { utils.housekeeping.list.invalidate(); setShowModal(false); }}
        />
      )}
    </DashboardLayout>
  );
}

function HousekeepingTaskModal({ staff, onClose, onSuccess }: {
  staff: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    roomId: "",
    type: "nettoyage",
    priority: "normale",
    assignedTo: "",
      scheduledAt: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: rooms } = trpc.rooms.list.useQuery();

  const createMutation = trpc.housekeeping.create.useMutation({
    onSuccess: () => { toast.success("Tâche créée"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.roomId) { toast.error("Chambre obligatoire"); return; }
    createMutation.mutate({
      roomId: parseInt(form.roomId),
      type: form.type as any,
      priority: form.priority as any,
      assignedTo: form.assignedTo ? parseInt(form.assignedTo) : undefined,
      scheduledAt: new Date(form.scheduledAt),
      notes: form.notes || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche de housekeeping</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Chambre *</Label>
            <Select value={form.roomId} onValueChange={(v) => setForm(f => ({ ...f, roomId: v }))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner une chambre" /></SelectTrigger>
              <SelectContent>
                {rooms?.map(r => (
                  <SelectItem key={r.id} value={r.id.toString()}>
                    Ch. {r.number} — {r.typeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type de tâche</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assigner à</Label>
            <Select value={form.assignedTo} onValueChange={(v) => setForm(f => ({ ...f, assignedTo: v }))}>
              <SelectTrigger><SelectValue placeholder="Non assigné" /></SelectTrigger>
              <SelectContent>
                {staff.map(e => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.firstName} {e.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date planifiée</Label>
            <Input type="date" value={form.scheduledAt} onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes / Instructions</Label>
            <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Instructions spéciales..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={createMutation.isPending}>{createMutation.isPending ? "Création..." : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
