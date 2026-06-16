import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { trpc } from "@/lib/trpc";
import {
  Edit,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLES: Record<string, { label: string; color: string }> = {
  admin: { label: "Administrateur", color: "bg-purple-100 text-purple-800" },
  manager: { label: "Manager", color: "bg-blue-100 text-blue-800" },
  receptionniste: { label: "Réceptionniste", color: "bg-teal-100 text-teal-800" },
  housekeeping: { label: "Housekeeping", color: "bg-green-100 text-green-800" },
  restauration: { label: "Restauration", color: "bg-orange-100 text-orange-800" },
  maintenance: { label: "Maintenance", color: "bg-red-100 text-red-800" },
  securite: { label: "Sécurité", color: "bg-gray-100 text-gray-700" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  actif: { label: "Actif", color: "bg-emerald-100 text-emerald-800" },
  inactif: { label: "Inactif", color: "bg-gray-100 text-gray-600" },
  conge: { label: "En congé", color: "bg-amber-100 text-amber-800" },
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function Employes() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [viewEmployee, setViewEmployee] = useState<any>(null);

  const { data: employees, isLoading } = trpc.employees.list.useQuery();

  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => { toast.success("Employé supprimé"); utils.employees.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = employees?.filter(e => {
    const matchSearch = !search ||
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.includes(search);
    const matchRole = filterRole === "all" || e.role === filterRole;
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  }) ?? [];

  const counts = {
    total: employees?.length ?? 0,
    actif: employees?.filter(e => e.status === "actif").length ?? 0,
    conge: employees?.filter(e => e.status === "conge").length ?? 0,
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Employés
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {counts.total} employé{counts.total > 1 ? "s" : ""} — {counts.actif} actif{counts.actif > 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => { setEditEmployee(null); setShowModal(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel employé
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Users className="h-4 w-4 text-blue-600" />, bg: "bg-blue-50", value: counts.total, label: "Total" },
            { icon: <UserCheck className="h-4 w-4 text-emerald-600" />, bg: "bg-emerald-50", value: counts.actif, label: "Actifs" },
            { icon: <User className="h-4 w-4 text-amber-600" />, bg: "bg-amber-50", value: counts.conge, label: "En congé" },
          ].map((stat, i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>{stat.icon}</div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un employé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tous les rôles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {Object.entries(ROLES).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Tous statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : !filtered.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Users className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-base font-medium">Aucun employé trouvé</p>
            <Button className="mt-4" onClick={() => { setEditEmployee(null); setShowModal(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un employé
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((emp) => {
              const roleCfg = ROLES[emp.role ?? "receptionniste"] ?? ROLES.receptionniste;
              const statusCfg = STATUS_CONFIG[emp.status ?? "actif"] ?? STATUS_CONFIG.actif;
              return (
                <Card key={emp.id} className="border border-border hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewEmployee(emp)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                        style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
                        {getInitials(emp.firstName, emp.lastName)}
                      </div>
                      <Badge variant="secondary" className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
                    </div>
                    <h3 className="font-semibold text-foreground">{emp.firstName} {emp.lastName}</h3>
                    <Badge variant="secondary" className={`text-xs mt-1 ${roleCfg.color}`}>{roleCfg.label}</Badge>
                    <div className="mt-3 space-y-1.5">
                      {emp.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{emp.email}</span>
                        </div>
                      )}
                      {emp.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={(e) => { e.stopPropagation(); setEditEmployee(emp); setShowModal(true); }}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Supprimer ${emp.firstName} ${emp.lastName} ?`)) {
                            deleteMutation.mutate({ id: emp.id });
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => { setShowModal(false); setEditEmployee(null); }}
          onSuccess={() => { utils.employees.list.invalidate(); setShowModal(false); setEditEmployee(null); }}
        />
      )}
      {viewEmployee && (
        <EmployeeDetailModal
          employee={viewEmployee}
          onClose={() => setViewEmployee(null)}
          onEdit={() => { setEditEmployee(viewEmployee); setViewEmployee(null); setShowModal(true); }}
        />
      )}
    </DashboardLayout>
  );
}

function EmployeeModal({ employee, onClose, onSuccess }: { employee: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    role: employee?.role ?? "receptionniste",
    status: employee?.status ?? "actif",
    hireDate: employee?.hireDate ? new Date(employee.hireDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    salary: employee?.salary ?? "",
    address: employee?.address ?? "",
    notes: employee?.notes ?? "",
  });

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => { toast.success("Employé créé"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => { toast.success("Employé mis à jour"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName) { toast.error("Prénom et nom obligatoires"); return; }
    const data = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      role: form.role as any,
      status: form.status as any,
      hireDate: form.hireDate || undefined,
      salary: form.salary || undefined,
      address: form.address || undefined,
      notes: form.notes || undefined,
    };
    if (employee) updateMutation.mutate({ id: employee.id, ...data });
    else createMutation.mutate(data);
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? "Modifier l'employé" : "Nouvel employé"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prénom *</Label>
              <Input value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date d'embauche</Label>
              <Input type="date" value={form.hireDate} onChange={(e) => setForm(f => ({ ...f, hireDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Salaire (FCFA)</Label>
              <Input type="number" min="0" value={form.salary} onChange={(e) => setForm(f => ({ ...f, salary: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Adresse</Label>
            <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1" disabled={isPending}>{isPending ? "Enregistrement..." : employee ? "Mettre à jour" : "Créer"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmployeeDetailModal({ employee, onClose, onEdit }: { employee: any; onClose: () => void; onEdit: () => void }) {
  const roleCfg = ROLES[employee.role ?? "receptionniste"] ?? ROLES.receptionniste;
  const statusCfg = STATUS_CONFIG[employee.status ?? "actif"] ?? STATUS_CONFIG.actif;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fiche employé</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shrink-0"
              style={{ background: "linear-gradient(135deg, #1e3a5f, #2563eb)" }}>
              {getInitials(employee.firstName, employee.lastName)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{employee.firstName} {employee.lastName}</h2>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary" className={`text-xs ${roleCfg.color}`}>{roleCfg.label}</Badge>
                <Badge variant="secondary" className={`text-xs ${statusCfg.color}`}>{statusCfg.label}</Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Email", value: employee.email },
              { label: "Téléphone", value: employee.phone },
              { label: "Date d'embauche", value: formatDate(employee.hireDate) },
              { label: "Salaire", value: employee.salary ? `${new Intl.NumberFormat("fr-FR").format(parseFloat(employee.salary))} FCFA` : "-" },
              { label: "Adresse", value: employee.address },
            ].filter(f => f.value).map((field, i) => (
              <div key={i} className={field.label === "Adresse" ? "col-span-2" : ""}>
                <p className="text-xs text-muted-foreground mb-0.5">{field.label}</p>
                <p className="font-medium text-foreground">{field.value}</p>
              </div>
            ))}
          </div>

          {employee.notes && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-foreground">{employee.notes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Fermer</Button>
            <Button className="flex-1" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
