import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  UtensilsCrossed,
  Tag,
  Clock,
  ChevronDown,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

// ─── Types locaux ─────────────────────────────────────────────────────────────
type Category = {
  id: number;
  name: string;
  description?: string | null;
  sortOrder: number;
};

type Item = {
  id: number;
  categoryId: number;
  name: string;
  description?: string | null;
  priceXOF: string;
  photoUrl?: string | null;
  available: boolean;
  preparationTime?: number | null;
  sortOrder: number;
};

// ─── Formulaire catégorie ─────────────────────────────────────────────────────
function CategoryForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Category>;
  onSave: (data: { name: string; description?: string; sortOrder?: number }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  return (
    <div className="space-y-3">
      <div>
        <Label>Nom de la catégorie *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Entrées, Plats, Boissons…" />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description optionnelle" />
      </div>
      <div>
        <Label>Ordre d'affichage</Label>
        <Input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button
          onClick={() => onSave({ name, description: description || undefined, sortOrder: parseInt(sortOrder) || 0 })}
          disabled={!name.trim()}
        >
          Enregistrer
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Formulaire plat ──────────────────────────────────────────────────────────
function ItemForm({
  initial,
  categories,
  onSave,
  onCancel,
}: {
  initial?: Partial<Item>;
  categories: Category[];
  onSave: (data: {
    categoryId: number;
    name: string;
    description?: string;
    priceXOF: string;
    available: boolean;
    preparationTime?: number;
    sortOrder?: number;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.priceXOF ?? "");
  const [categoryId, setCategoryId] = useState<number>(initial?.categoryId ?? (categories[0]?.id ?? 0));
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [prepTime, setPrepTime] = useState(String(initial?.preparationTime ?? 15));
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nom du plat *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Poulet yassa, Thiéboudienne…" />
        </div>
        <div>
          <Label>Catégorie *</Label>
          <Select value={String(categoryId)} onValueChange={(v) => setCategoryId(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Prix (FCFA) *</Label>
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex : 2500" />
        </div>
        <div>
          <Label>Temps de préparation (min)</Label>
          <Input type="number" min={0} value={prepTime} onChange={(e) => setPrepTime(e.target.value)} />
        </div>
        <div>
          <Label>Ordre d'affichage</Label>
          <Input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ingrédients, allergènes, notes…" rows={2} />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <Switch checked={available} onCheckedChange={setAvailable} id="available" />
          <Label htmlFor="available">Disponible à la commande</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Annuler</Button>
        <Button
          onClick={() =>
            onSave({
              categoryId,
              name,
              description: description || undefined,
              priceXOF: price,
              available,
              preparationTime: parseInt(prepTime) || 15,
              sortOrder: parseInt(sortOrder) || 0,
            })
          }
          disabled={!name.trim() || !price || !categoryId}
        >
          Enregistrer
        </Button>
      </DialogFooter>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function MenuCatalogue() {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);

  // Modals
  const [catModal, setCatModal] = useState<{ open: boolean; editing?: Category }>({ open: false });
  const [itemModal, setItemModal] = useState<{ open: boolean; editing?: Item }>({ open: false });
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set());

  // Queries
  const { data: categories = [], isLoading: catsLoading } = trpc.menu.listCategories.useQuery();
  const { data: allItems = [], isLoading: itemsLoading } = trpc.menu.listItems.useQuery({});

  // Mutations
  const createCat = trpc.menu.createCategory.useMutation({
    onSuccess: () => { utils.menu.listCategories.invalidate(); setCatModal({ open: false }); toast.success("Catégorie créée"); },
    onError: (e) => toast.error(e.message),
  });
  const updateCat = trpc.menu.updateCategory.useMutation({
    onSuccess: () => { utils.menu.listCategories.invalidate(); setCatModal({ open: false }); toast.success("Catégorie mise à jour"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCat = trpc.menu.deleteCategory.useMutation({
    onSuccess: () => { utils.menu.listCategories.invalidate(); utils.menu.listItems.invalidate(); toast.success("Catégorie supprimée"); },
    onError: (e) => toast.error(e.message),
  });
  const createItem = trpc.menu.createItem.useMutation({
    onSuccess: () => { utils.menu.listItems.invalidate(); setItemModal({ open: false }); toast.success("Plat créé"); },
    onError: (e) => toast.error(e.message),
  });
  const updateItem = trpc.menu.updateItem.useMutation({
    onSuccess: () => { utils.menu.listItems.invalidate(); setItemModal({ open: false }); toast.success("Plat mis à jour"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteItem = trpc.menu.deleteItem.useMutation({
    onSuccess: () => { utils.menu.listItems.invalidate(); toast.success("Plat supprimé"); },
    onError: (e) => toast.error(e.message),
  });
  const uploadPhoto = trpc.menu.uploadPhoto.useMutation({
    onSuccess: () => { utils.menu.listItems.invalidate(); setUploadingItemId(null); toast.success("Photo mise à jour"); },
    onError: (e) => { setUploadingItemId(null); toast.error(e.message); },
  });

  const toggleCat = (id: number) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, itemId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Fichier trop lourd (max 5 Mo)"); return; }
    setUploadingItemId(itemId);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadPhoto.mutate({ itemId, fileBase64: base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  if (catsLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement du catalogue…</div>
      </div>
    );
  }

  const itemsByCategory = (catId: number) => allItems.filter((i) => i.categoryId === catId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-orange-500" />
            Catalogue des produits
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez vos catégories et vos plats — {categories.length} catégorie(s), {allItems.length} plat(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatModal({ open: true })}>
            <Tag className="w-4 h-4 mr-2" /> Nouvelle catégorie
          </Button>
          <Button
            onClick={() => setItemModal({ open: true })}
            disabled={categories.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Nouveau plat
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <div className="border-2 border-dashed rounded-xl p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Catalogue vide</h3>
          <p className="text-muted-foreground mb-4">Commencez par créer une catégorie (ex : Entrées, Plats, Desserts, Boissons)</p>
          <Button onClick={() => setCatModal({ open: true })}>
            <Tag className="w-4 h-4 mr-2" /> Créer une catégorie
          </Button>
        </div>
      )}

      {/* Catalogue par catégorie */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const items = itemsByCategory(cat.id);
          const expanded = expandedCats.has(cat.id);
          return (
            <div key={cat.id} className="border rounded-xl overflow-hidden">
              {/* Category header */}
              <div
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCat(cat.id)}
              >
                <div className="flex items-center gap-3">
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <Tag className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold">{cat.name}</span>
                  {cat.description && (
                    <span className="text-muted-foreground text-sm">— {cat.description}</span>
                  )}
                  <Badge variant="secondary">{items.length} plat(s)</Badge>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setItemModal({ open: true, editing: { id: 0, categoryId: cat.id, name: "", priceXOF: "0", available: true, sortOrder: 0 } })}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Plat
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setCatModal({ open: true, editing: cat })}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Supprimer la catégorie "${cat.name}" et tous ses plats ?`))
                        deleteCat.mutate({ id: cat.id });
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Items grid */}
              {expanded && (
                <div className="p-4">
                  {items.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      Aucun plat dans cette catégorie.{" "}
                      <button
                        className="text-orange-500 underline"
                        onClick={() => setItemModal({ open: true, editing: { id: 0, categoryId: cat.id, name: "", priceXOF: "0", available: true, sortOrder: 0 } })}
                      >
                        Ajouter un plat
                      </button>
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <div key={item.id} className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
                          {/* Photo */}
                          <div className="relative h-36 bg-muted">
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <ImageIcon className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            {/* Upload overlay */}
                            <button
                              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-medium"
                              onClick={() => {
                                setUploadingItemId(item.id);
                                fileInputRef.current?.click();
                              }}
                            >
                              {uploadingItemId === item.id ? (
                                <span className="animate-pulse">Envoi…</span>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-1" />
                                  Changer la photo
                                </>
                              )}
                            </button>
                            {/* Available badge */}
                            <div className="absolute top-2 right-2">
                              <Badge className={item.available ? "bg-green-500 text-white" : "bg-gray-400 text-white"}>
                                {item.available ? "Disponible" : "Indisponible"}
                              </Badge>
                            </div>
                          </div>
                          {/* Info */}
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{item.name}</p>
                                {item.description && (
                                  <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{item.description}</p>
                                )}
                              </div>
                              <p className="font-bold text-orange-600 whitespace-nowrap">
                                {parseInt(item.priceXOF).toLocaleString()} FCFA
                              </p>
                            </div>
                            {item.preparationTime && (
                              <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {item.preparationTime} min
                              </p>
                            )}
                            {/* Actions */}
                            <div className="flex gap-2 mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setItemModal({ open: true, editing: item })}
                              >
                                <Pencil className="w-3 h-3 mr-1" /> Modifier
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateItem.mutate({ id: item.id, available: !item.available })
                                }
                                title={item.available ? "Rendre indisponible" : "Rendre disponible"}
                              >
                                {item.available ? "⏸" : "▶"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm(`Supprimer "${item.name}" ?`))
                                    deleteItem.mutate({ id: item.id });
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (uploadingItemId !== null) handlePhotoSelect(e, uploadingItemId);
        }}
      />

      {/* Category modal */}
      <Dialog open={catModal.open} onOpenChange={(o) => setCatModal({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catModal.editing ? "Modifier la catégorie" : "Nouvelle catégorie"}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            initial={catModal.editing}
            onSave={(data) => {
              if (catModal.editing) {
                updateCat.mutate({ id: catModal.editing.id, ...data });
              } else {
                createCat.mutate(data);
              }
            }}
            onCancel={() => setCatModal({ open: false })}
          />
        </DialogContent>
      </Dialog>

      {/* Item modal */}
      <Dialog open={itemModal.open} onOpenChange={(o) => setItemModal({ open: o })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{itemModal.editing?.id ? "Modifier le plat" : "Nouveau plat"}</DialogTitle>
          </DialogHeader>
          <ItemForm
            initial={itemModal.editing}
            categories={categories}
            onSave={(data) => {
              if (itemModal.editing?.id) {
                updateItem.mutate({ id: itemModal.editing.id, ...data });
              } else {
                createItem.mutate(data);
              }
            }}
            onCancel={() => setItemModal({ open: false })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
