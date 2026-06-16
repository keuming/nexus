import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function TransportSettings() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: myCompany, isLoading } = trpc.transport.myCompany.useQuery(undefined, { enabled: !!user });

  const [form, setForm] = useState({
    companyName: "",
    managerName: "",
    phone: "",
    email: "",
    address: "",
    description: "",
    logoUrl: "",
    primaryColor: "#f97316",
    printHeaderText: "",
    printFooterText: "",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (myCompany) {
      setForm({
        companyName: myCompany.companyName ?? "",
        managerName: myCompany.managerName ?? "",
        phone: myCompany.phone ?? "",
        email: myCompany.email ?? "",
        address: myCompany.address ?? "",
        description: myCompany.description ?? "",
        logoUrl: myCompany.logoUrl ?? "",
        primaryColor: myCompany.primaryColor ?? "#f97316",
        printHeaderText: myCompany.printHeaderText ?? "",
        printFooterText: myCompany.printFooterText ?? "",
      });
    }
  }, [myCompany]);

  const updateMutation = trpc.transport.company.update.useMutation({
    onSuccess: () => {
      utils.transport.myCompany.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!myCompany || myCompany.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Accès non autorisé</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/transport/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" />Retour
          </Button>
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-orange-500" />
            <h1 className="text-lg font-bold">Paramètres — {myCompany.companyName}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* General info */}
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>Informations visibles sur la plateforme publique</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Nom de la compagnie</Label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Directeur</Label>
                <Input value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Adresse</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle>Personnalisation visuelle</CardTitle>
            <CardDescription>Logo et couleur principale de votre compagnie</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>URL du logo</Label>
                <Input
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://..."
                />
                {form.logoUrl && (
                  <img src={form.logoUrl} alt="Logo preview" className="h-16 w-16 rounded-lg object-cover mt-2 border" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Couleur principale</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="h-10 w-16 rounded border cursor-pointer"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                    className="flex-1"
                    placeholder="#f97316"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print customization */}
        <Card>
          <CardHeader>
            <CardTitle>Personnalisation des documents imprimés</CardTitle>
            <CardDescription>Entête et pied de page pour les billets et tickets d'expédition</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Entête des documents</Label>
                <Textarea
                  rows={3}
                  value={form.printHeaderText}
                  onChange={(e) => setForm({ ...form, printHeaderText: e.target.value })}
                  placeholder="Ex: COMPAGNIE TRANS-AFRIQUE · Tél: +225 07 00 00 00 · Siège: Abidjan, Plateau"
                />
                <p className="text-xs text-gray-400">Texte affiché en haut des billets et tickets d'expédition</p>
              </div>
              <div className="space-y-1.5">
                <Label>Pied de page des documents</Label>
                <Textarea
                  rows={2}
                  value={form.printFooterText}
                  onChange={(e) => setForm({ ...form, printFooterText: e.target.value })}
                  placeholder="Ex: Merci de voyager avec nous. Bon voyage !"
                />
              </div>

              {/* Print preview */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Aperçu document</p>
                <div className="bg-white border rounded p-4 text-xs space-y-2">
                  <div className="text-center border-b pb-2" style={{ color: form.primaryColor }}>
                    <p className="font-bold text-sm">{form.companyName || "NOM DE LA COMPAGNIE"}</p>
                    <p className="text-gray-600 text-xs">{form.printHeaderText || "Entête personnalisée..."}</p>
                  </div>
                  <div className="py-2 text-gray-500 text-center">
                    <p>— Contenu du billet —</p>
                  </div>
                  <div className="text-center border-t pt-2 text-gray-400">
                    <p>{form.printFooterText || "Pied de page personnalisé..."}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <Save className="h-4 w-4" />
              Paramètres sauvegardés
            </div>
          )}
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate(form)}
          >
            {updateMutation.isPending ? "Sauvegarde..." : "Sauvegarder les paramètres"}
          </Button>
        </div>
      </div>
    </div>
  );
}
