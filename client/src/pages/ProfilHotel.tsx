import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe,
  Hotel,
  Image,
  Mail,
  MapPin,
  Phone,
  Save,
  Star,
  Upload,
  User,
  Utensils,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function ProfilHotel() {
  return (
    <DashboardLayout>
      <ProfilHotelContent />
    </DashboardLayout>
  );
}

function ProfilHotelContent() {
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.publicHotels.myProfile.useQuery();
  const { data: countries } = trpc.geo.countries.useQuery();

  const [form, setForm] = useState({
    hotelName: "",
    managerName: "",
    phone: "",
    email: "",
    address: "",
    countryId: "",
    cityId: "",
    type: "hotel" as "hotel" | "restaurant",
    stars: "4",
    description: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: cities } = trpc.geo.cities.useQuery(
    { countryId: parseInt(form.countryId) },
    { enabled: !!form.countryId }
  );

  // Pre-fill form with existing profile
  useEffect(() => {
    if (profile) {
      setForm({
        hotelName: profile.hotelName ?? "",
        managerName: profile.managerName ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        address: profile.address ?? "",
        countryId: profile.countryId?.toString() ?? "",
        cityId: profile.cityId?.toString() ?? "",
        type: (profile.type as any) ?? "hotel",
        stars: profile.stars?.toString() ?? "4",
        description: profile.description ?? "",
      });
      if (profile.logoUrl) setLogoPreview(profile.logoUrl);
    }
  }, [profile]);

  const upsertMutation = trpc.publicHotels.upsert.useMutation({
    onSuccess: () => {
      utils.publicHotels.myProfile.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profil mis à jour avec succès");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadLogoMutation = trpc.publicHotels.uploadLogo.useMutation({
    onSuccess: (data) => {
      setLogoPreview(data.url);
      utils.publicHotels.myProfile.invalidate();
      toast.success("Logo mis à jour");
    },
    onError: (e) => toast.error("Erreur upload logo: " + e.message),
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo trop lourd (max 2 Mo)"); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hotelName) { toast.error("Le nom de l'établissement est obligatoire"); return; }

    let logoUrl: string | undefined = profile?.logoUrl ?? undefined;
    if (logoFile) {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve((ev.target?.result as string).split(",")[1]);
        reader.readAsDataURL(logoFile);
      });
      const res = await uploadLogoMutation.mutateAsync({
        fileName: logoFile.name,
        fileData: base64,
        mimeType: logoFile.type,
      });
      logoUrl = res.url;
    }

    upsertMutation.mutate({
      hotelName: form.hotelName,
      managerName: form.managerName || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      countryId: form.countryId ? parseInt(form.countryId) : undefined,
      cityId: form.cityId ? parseInt(form.cityId) : undefined,
      type: form.type,
      stars: parseInt(form.stars),
      description: form.description || undefined,
      logoUrl,
    });
  }

  const isPending = upsertMutation.isPending || uploadLogoMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Profil de l'établissement
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ces informations sont visibles sur l'interface publique HUB_RESA
          </p>
        </div>
        {profile && (
          <a
            href={`/hotel/${profile.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Voir la page publique
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Type d'établissement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "hotel", icon: <Hotel className="h-5 w-5" />, label: "Hôtel" },
                { value: "restaurant", icon: <Utensils className="h-5 w-5" />, label: "Restaurant" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: opt.value as any }))}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    form.type === opt.value
                      ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                      : "border-border bg-background text-muted-foreground hover:border-border/80"
                  }`}
                >
                  {opt.icon}
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Image className="h-4 w-4" /> Logo de l'établissement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-500/5 transition-all"
              onClick={() => fileRef.current?.click()}
            >
              {logoPreview ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={logoPreview} alt="Logo preview" className="h-28 w-28 object-contain rounded-xl border border-border" />
                  <p className="text-xs text-muted-foreground">{logoFile?.name ?? "Logo actuel"}</p>
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Changer le logo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliquez pour uploader votre logo</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, SVG — max 2 Mo</p>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Nom de l'établissement *
              </Label>
              <Input
                value={form.hotelName}
                onChange={(e) => setForm(f => ({ ...f, hotelName: e.target.value }))}
                placeholder="Ex: Grand Hôtel de NOE"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nom du gérant
              </Label>
              <Input
                value={form.managerName}
                onChange={(e) => setForm(f => ({ ...f, managerName: e.target.value }))}
                placeholder="Ex: Jean Dupont"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> Pays
                </Label>
                <Select value={form.countryId} onValueChange={(v) => setForm(f => ({ ...f, countryId: v, cityId: "" }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.flag} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Ville
                </Label>
                <Select value={form.cityId} onValueChange={(v) => setForm(f => ({ ...f, cityId: v }))} disabled={!form.countryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={form.countryId ? "Sélectionner" : "Choisir pays"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities?.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Contact
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+229 XX XX XX XX"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> E-mail
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="contact@hotel.com"
                />
              </div>
            </div>

            {form.type === "hotel" && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" /> Classement étoiles
                </Label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, stars: n.toString() }))}
                      className="focus:outline-none"
                    >
                      <Star className={`h-7 w-7 transition-colors ${parseInt(form.stars) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Adresse</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Rue, quartier, ville..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez votre établissement..."
                className="resize-none"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          size="lg"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12"
          disabled={isPending}
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Profil enregistré !
            </>
          ) : isPending ? (
            "Enregistrement..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer le profil
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
