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
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Edit,
  Package,
  PackageMinus,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(amount))} FCFA`;
}

export default function Inventaire() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAlert, setFilterAlert] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showMovement, setShowMovement] = useState<any>(null);

  const { data: categories } = trpc.inventory.getCategories.useQuery();
  const { data: allItems, isLoading } = trpc.inventory.list.useQuery();
  const items = allItems?.filter(item => filterCategory === "all" || item.categoryId?.toString() === filterCategory);

  const filtered = items?.filter(item => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.location?.toLowerCase().includes(search.toLowerCase());
    const matchAlert = !filterAlert || (parseFloat(item.currentStock ?? "0") <= parseFloat(item.minStock ?? "0"));
    return matchSearch && matchAlert;
  }) ?? [];

  const criticalCount = items?.filter(i => parseFloat(i.currentStock ?? "0") <= parseFloat(i.minStock ?? "0")).length ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Inventaire
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {items?.length ?? 0} article{(items?.length ?? 0) > 1 ? "s" : ""} en stock
            </p>
          </div>
          <Button onClick={() => setShowAddItem(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel article
          </Button>
        </div>

        {/* Alert Banner */}
        {criticalCount > 0 && (
          <div
            className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => setFilterAlert(!filterAlert)}
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                {criticalCount} article{criticalCount > 1 ? "s" : ""} en stock critique
              </p>
              <p className="text-xs text-amber-700">Cliquez pour {filterAlert ? "voir tous les articles" : "afficher uniquement les alertes"}</p>
            </div>
            <Badge variant="secondary" className="ml-auto bg-amber-200 text-amber-900">{criticalCount}</Badge>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un article..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Toutes catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories?.map(cat => (
                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card className="border border-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement...</div>
          ) : !filtered.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Package className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-base font-medium">Aucun article trouvé</p>
              <Button className="mt-4" onClick={() => setShowAddItem(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Article</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Référence</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Catégorie</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Stock actuel</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Stock min.</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Unité</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Prix unitaire</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, idx) => {
                    const current = parseFloat(item.currentStock ?? "0");
                    const min = parseFloat(item.minStock ?? "0");
                    const isCritical = current <= min;
                    const isLow = current <= min * 1.5 && !isCritical;
                    return (
                      <tr key={item.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isCritical && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                            <span className="text-sm font-medium text-foreground">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{item.location || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.categoryName || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-bold ${isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-700"}`}>
                            {current}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{min}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.unit || "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {item.unitCost ? formatCurrency(parseFloat(item.unitCost)) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={`text-xs ${isCritical ? "bg-red-100 text-red-800" : isLow ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {isCritical ? "Critique" : isLow ? "Bas" : "Normal"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700"
                              onClick={() => setShowMovement({ item, type: "entree" })}
                              title="Entrée de stock"
                            >
                              <PackagePlus className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-600"
                              onClick={() => setShowMovement({ item, type: "sortie" })}
                              title="Sortie de stock"
                            >
                              <PackageMinus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {showAddItem && (
        <AddItemModal
          categories={categories ?? []}
          onClose={() => setShowAddItem(false)}
          onSuccess={() => { utils.inventory.list.invalidate(); setShowAddItem(false); }}
        />
      )}
      {showMovement && (
        <StockMovementModal
          item={showMovement.item}
          type={showMovement.type}
          onClose={() => setShowMovement(null)}
          onSuccess={() => { utils.inventory.list.invalidate(); setShowMovement(null); }}
        />
      )}
    </DashboardLayout>
  );
}

function AddItemModal({ categories, onClose, onSuccess }: { categories: any[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    unit: "unité",
    currentStock: "0",
    minStock: "5",
    maxStock: "100",
    unitPrice: "",
    description: "",
  });

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => { toast.success("Article créé"); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Nom obligatoire"); return; }
    createMutation.mutate({
      name: form.name,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      unit: form.unit || undefined,
      currentStock: form.currentStock,
      minStock: form.minStock,
      maxStock: form.maxStock || undefined,
      unitCost: form.unitPrice || undefined,
    });
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvel article</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label>Nom de l'article *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Serviettes de bain" />
            </div>
            <div className="space-y-1.5">
              <Label>Référence</Label>
              <Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pièce, kg, litre..." />
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stock actuel</Label>
              <Input type="number" min="0" value={form.currentStock} onChange={(e) => setForm(f => ({ ...f, currentStock: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Stock minimum</Label>
              <Input type="number" min="0" value={form.minStock} onChange={(e) => setForm(f => ({ ...f, minStock: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Unité</Label>
              <Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pièce, kg, litre..." />
            </div>
            <div className="space-y-1.5">
              <Label>Prix unitaire (FCFA)</Label>
              <Input type="number" min="0" value={form.unitPrice} onChange={(e) => setForm(f => ({ ...f, unitPrice: e.target.value }))} />
            </div>
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

function StockMovementModal({ item, type, onClose, onSuccess }: { item: any; type: "entree" | "sortie"; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ quantity: "", reason: "" });

  const moveMutation = trpc.inventory.addMovement.useMutation({
    onSuccess: () => { toast.success(`${type === "entree" ? "Entrée" : "Sortie"} de stock enregistrée`); onSuccess(); },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.quantity || parseFloat(form.quantity) <= 0) { toast.error("Quantité invalide"); return; }
    moveMutation.mutate({
      itemId: item.id,
      type,
      quantity: form.quantity,
      reason: form.reason || undefined,
    });
  }

  const current = parseFloat(item.currentStock ?? "0");
  const qty = parseFloat(form.quantity || "0");
  const newStock = type === "entree" ? current + qty : current - qty;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className={type === "entree" ? "text-emerald-700" : "text-red-700"}>
            {type === "entree" ? <><PackagePlus className="inline h-4 w-4 mr-1.5" />Entrée de stock</> : <><PackageMinus className="inline h-4 w-4 mr-1.5" />Sortie de stock</>}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Stock actuel : <span className="font-semibold">{current} {item.unit}</span></p>
          </div>
          <div className="space-y-1.5">
            <Label>Quantité *</Label>
            <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="0" autoFocus />
          </div>
          {form.quantity && (
            <div className={`p-3 rounded-lg text-sm ${newStock < 0 ? "bg-red-50 text-red-700" : "bg-muted/30 text-foreground"}`}>
              Nouveau stock : <span className="font-bold">{Math.max(0, newStock)} {item.unit}</span>
              {newStock < 0 && <span className="ml-2 text-xs">(stock insuffisant)</span>}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Motif</Label>
            <Textarea value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} placeholder="Motif du mouvement..." />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className={`flex-1 ${type === "entree" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"} text-white`} disabled={moveMutation.isPending || (type === "sortie" && newStock < 0)}>
              {moveMutation.isPending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
