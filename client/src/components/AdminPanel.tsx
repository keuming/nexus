/**
 * AdminPanel.tsx
 * Panneau de gestion des admins dans le dashboard HUB_RESA :
 * - Onglet "Accès Admin" : profils admin par mot de passe (CRUD + toggle + journal)
 * - Onglet "Administrateurs" : utilisateurs OAuth (promotion/rétrogradation)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Shield, UserPlus, Trash2, Key, Clock, CheckCircle, XCircle,
  Crown, UserMinus, Users, Activity
} from "lucide-react";

// ─── Onglet : Profils Admin (mot de passe) ────────────────────────────────────
function AdminCredentialsTab() {
  const { data: admins, refetch } = trpc.adminAuth.listAdmins.useQuery();
  const { data: logs } = trpc.adminAuth.loginLogs.useQuery({ limit: 100 });
  const addAdmin = trpc.adminAuth.addAdmin.useMutation({ onSuccess: () => { refetch(); toast.success("Profil admin créé"); setOpenAdd(false); } });
  const toggleAdmin = trpc.adminAuth.toggleAdmin.useMutation({ onSuccess: () => { refetch(); toast.success("Statut mis à jour"); } });
  const deleteAdmin = trpc.adminAuth.deleteAdmin.useMutation({ onSuccess: () => { refetch(); toast.success("Profil supprimé"); } });
  const changePassword = trpc.adminAuth.changePassword.useMutation({ onSuccess: () => { toast.success("Mot de passe modifié"); setOpenPwd(null); } });

  const [openAdd, setOpenAdd] = useState(false);
  const [openPwd, setOpenPwd] = useState<number | null>(null);
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [newPwd, setNewPwd] = useState("");

  return (
    <div className="space-y-6">
      {/* Liste des profils admin */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-500" />
            Profils administrateurs ({admins?.length ?? 0})
          </CardTitle>
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <UserPlus className="h-4 w-4" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouveau profil admin</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Nom affiché</Label>
                  <Input placeholder="Ex : Keuming" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="admin@exemple.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Mot de passe</Label>
                  <Input type="password" placeholder="Min. 4 caractères" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <Button className="w-full" disabled={addAdmin.isPending} onClick={() => addAdmin.mutate(form)}>
                  {addAdmin.isPending ? "Création..." : "Créer le profil"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {admins?.map(admin => (
              <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${admin.isActive ? "bg-green-500" : "bg-gray-400"}`} />
                  <div>
                    <p className="font-medium text-sm">{admin.displayName}</p>
                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                    {admin.lastLoginAt && (
                      <p className="text-xs text-muted-foreground">
                        Dernière connexion : {new Date(admin.lastLoginAt).toLocaleString("fr-FR")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={admin.isActive}
                    onCheckedChange={v => toggleAdmin.mutate({ id: admin.id, isActive: v })}
                  />
                  <Dialog open={openPwd === admin.id} onOpenChange={v => setOpenPwd(v ? admin.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Key className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Changer le mot de passe</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-2">
                        <Input type="password" placeholder="Nouveau mot de passe" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
                        <Button className="w-full" onClick={() => changePassword.mutate({ id: admin.id, newPassword: newPwd })}>
                          Confirmer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => { if (confirm("Supprimer ce profil ?")) deleteAdmin.mutate({ id: admin.id }); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Journal des connexions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Journal des connexions (100 dernières)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {logs?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune connexion enregistrée</p>}
            {logs?.map(log => (
              <div key={log.id} className="flex items-center justify-between text-xs p-2 rounded border">
                <div className="flex items-center gap-2">
                  {log.success
                    ? <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                  <span className="font-medium">{log.displayName ?? log.email}</span>
                  <span className="text-muted-foreground">{log.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(log.createdAt).toLocaleString("fr-FR")}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Onglet : Utilisateurs OAuth (promotion/rétrogradation) ──────────────────
function OAuthUsersTab() {
  const { data: userList, refetch } = trpc.adminAuth.listUsers.useQuery();
  const promote = trpc.adminAuth.promoteUser.useMutation({ onSuccess: () => { refetch(); toast.success("Utilisateur promu admin"); } });
  const demote = trpc.adminAuth.demoteUser.useMutation({ onSuccess: () => { refetch(); toast.success("Utilisateur rétrogradé"); } });
  const [search, setSearch] = useState("");

  const filtered = userList?.filter(u =>
    (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500" />
          Utilisateurs connectés via OAuth ({userList?.length ?? 0})
        </CardTitle>
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mt-2"
        />
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filtered?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun utilisateur trouvé</p>}
          {filtered?.map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{user.name ?? "Sans nom"}</p>
                  {user.role === "admin" && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                      <Crown className="h-3 w-3 mr-1" /> Admin
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user.email ?? "Email non renseigné"}</p>
                <p className="text-xs text-muted-foreground">
                  Dernière connexion : {new Date(user.lastSignedIn).toLocaleString("fr-FR")}
                </p>
              </div>
              <div>
                {user.role === "admin" ? (
                  <Button variant="outline" size="sm" className="gap-1 text-orange-600 border-orange-200"
                    onClick={() => { if (confirm("Rétrograder cet utilisateur ?")) demote.mutate({ userId: user.id }); }}>
                    <UserMinus className="h-3.5 w-3.5" /> Rétrograder
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1 text-green-600 border-green-200"
                    onClick={() => promote.mutate({ userId: user.id })}>
                    <Crown className="h-3.5 w-3.5" /> Promouvoir admin
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function AdminPanel() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-500" />
          Gestion des accès administrateurs
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les profils admin (connexion par mot de passe) et les droits des utilisateurs OAuth.
        </p>
      </div>
      <Tabs defaultValue="credentials">
        <TabsList>
          <TabsTrigger value="credentials" className="gap-1.5">
            <Shield className="h-4 w-4" /> Accès Admin
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="h-4 w-4" /> Administrateurs OAuth
          </TabsTrigger>
        </TabsList>
        <TabsContent value="credentials" className="mt-4">
          <AdminCredentialsTab />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <OAuthUsersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
