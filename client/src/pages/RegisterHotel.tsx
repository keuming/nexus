import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  Hotel,
  Image,
  Mail,
  MapPin,
  Phone,
  Star,
  Upload,
  User,
  Utensils,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function RegisterHotel() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    hotelName: "",
    managerName: "",
    phone: "",
    email: "",
    address: "",
    countryId: "",
    cityId: "",
    type: "hotel" as "hotel" | "restaurant",
    stars: "3",
    description: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "success">("form");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: countries } = trpc.geo.countries.useQuery();
  const { data: cities } = trpc.geo.cities.useQuery(
    { countryId: parseInt(form.countryId) },
    { enabled: !!form.countryId }
  );

  const upsertMutation = trpc.publicHotels.upsert.useMutation({
    onSuccess: () => {
      utils.publicHotels.myProfile.invalidate();
      setStep("success");
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadLogoMutation = trpc.publicHotels.uploadLogo.useMutation({
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
    if (!user) { window.location.href = getLoginUrl(); return; }

    let logoUrl: string | undefined;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.05_250)] to-[oklch(0.15_0.04_250)] flex items-center justify-center">
        <div className="text-white/50">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.18_0.05_250)] via-[oklch(0.22_0.06_250)] to-[oklch(0.15_0.04_250)]">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Retour à l'accueil</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>NEXUS</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {step === "success" ? (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Établissement enregistré !
            </h2>
            <p className="text-white/60 mb-8">
              Votre établissement est maintenant visible sur NEXUS. Accédez à votre tableau de bord pour gérer vos chambres et réservations.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setLocation("/")}>
                Voir l'accueil
              </Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setLocation("/dashboard")}>
                Accéder au dashboard
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Inscrire mon établissement
              </h1>
              <p className="text-white/50">
                {user ? "Complétez le formulaire pour rejoindre NEXUS" : "Connectez-vous pour inscrire votre établissement"}
              </p>
            </div>

            {!user ? (
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Connexion requise</h3>
                  <p className="text-white/50 mb-6 text-sm">Vous devez être connecté pour inscrire votre établissement sur NEXUS.</p>
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => { window.location.href = getLoginUrl(); }}
                  >
                    Se connecter
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type */}
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm">Type d'établissement *</Label>
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
                                ? "border-amber-500 bg-amber-500/20 text-amber-300"
                                : "border-white/20 bg-white/5 text-white/60 hover:border-white/40"
                            }`}
                          >
                            {opt.icon}
                            <span className="font-medium">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <Label className="text-white/70 text-sm flex items-center gap-1.5">
                        <Image className="h-3.5 w-3.5" /> Logo de l'établissement
                      </Label>
                      <div
                        className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
                        onClick={() => fileRef.current?.click()}
                      >
                        {logoPreview ? (
                          <div className="flex flex-col items-center gap-3">
                            <img src={logoPreview} alt="Logo preview" className="h-24 w-24 object-contain rounded-lg" />
                            <p className="text-xs text-white/50">{logoFile?.name}</p>
                            <Button type="button" variant="ghost" size="sm" className="text-white/50 hover:text-white">
                              Changer le logo
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center">
                              <Upload className="h-6 w-6 text-white/40" />
                            </div>
                            <div>
                              <p className="text-sm text-white/60">Cliquez pour uploader votre logo</p>
                              <p className="text-xs text-white/30 mt-1">PNG, JPG, SVG — max 2 Mo</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>

                    {/* Hotel Name */}
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-sm flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" /> Nom de l'établissement *
                      </Label>
                      <Input
                        value={form.hotelName}
                        onChange={(e) => setForm(f => ({ ...f, hotelName: e.target.value }))}
                        placeholder="Ex: Grand Hôtel de NOE"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                        required
                      />
                    </div>

                    {/* Manager Name */}
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-sm flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Nom du gérant
                      </Label>
                      <Input
                        value={form.managerName}
                        onChange={(e) => setForm(f => ({ ...f, managerName: e.target.value }))}
                        placeholder="Ex: Jean Dupont"
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>

                    {/* Country & City */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-white/70 text-sm flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5" /> Pays
                        </Label>
                        <Select value={form.countryId} onValueChange={(v) => setForm(f => ({ ...f, countryId: v, cityId: "" }))}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
                        <Label className="text-white/70 text-sm flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" /> Ville
                        </Label>
                        <Select value={form.cityId} onValueChange={(v) => setForm(f => ({ ...f, cityId: v }))} disabled={!form.countryId}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white disabled:opacity-50">
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

                    {/* Phone & Email */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-white/70 text-sm flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> Contact
                        </Label>
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+229 XX XX XX XX"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white/70 text-sm flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> Adresse e-mail
                        </Label>
                        <Input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="contact@hotel.com"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                        />
                      </div>
                    </div>

                    {/* Stars (only for hotels) */}
                    {form.type === "hotel" && (
                      <div className="space-y-2">
                        <Label className="text-white/70 text-sm flex items-center gap-1.5">
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
                              <Star className={`h-7 w-7 transition-colors ${parseInt(form.stars) >= n ? "fill-amber-400 text-amber-400" : "text-white/20"}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-sm">Adresse</Label>
                      <Input
                        value={form.address}
                        onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Rue, quartier, ville..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <Label className="text-white/70 text-sm">Description</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Décrivez votre établissement..."
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none"
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white h-12 text-base font-semibold"
                      disabled={isPending}
                    >
                      {isPending ? "Enregistrement..." : "Inscrire mon établissement"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
