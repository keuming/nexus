import { useAuth } from "@/_core/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GalleryPhotoUpload } from "@/components/GalleryPhotoUpload";
import { getLoginUrl } from "@/const";
import { useI18n } from "@/lib/i18n";
import { COUNTRIES, getCitiesByCountry } from "@/lib/transport-geo";
import { trpc } from "@/lib/trpc";
import { Bus, CheckCircle, Clock, LogIn, Package, UtensilsCrossed, XCircle, Hotel, ShoppingBag, Plane, Home, Gamepad2, Warehouse } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function RegisterCompany() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  useSEO({
    title: "Inscrire ma compagnie sur HUB_RESA",
    description: "Inscrivez votre compagnie de transport, restaurant, hôtel, boutique ou agence d'expédition sur HUB_RESA. Accédez à des milliers de clients en Afrique de l'Ouest et Centrale.",
    keywords: "inscription compagnie HUB RESA, partenaire transport Afrique, rejoindre plateforme, enregistrement compagnie",
    canonicalPath: "/register-company",
  });
  const [, navigate] = useLocation();
  
  // Extraire le paramètre bdev de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const bdevFromUrl = urlParams.get("bdev") || "";
  const [countryId, setCountryId] = useState<number>(1);
  const [activityType, setActivityType] = useState<"transport" | "restauration" | "expedition" | "hotel" | "boutique" | "agence_voyage" | "residence_meuble" | "loisirs" | "location_vente">("transport");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    managerName: "",
    phone: "",
    email: "",
    address: "",
    cityId: "",
    description: "",
    // Champs spécifiques par type d'activité
    iataCode: "",           // Agence de voyage
    licenseNumber: "",      // Agence de voyage / Transport
    fleetSize: "",          // Transport
    seatingCapacity: "",    // Restaurant
    deliveryAvailable: false, // Restaurant
    roomCount: "",          // Hôtel
    starRating: "",         // Hôtel
    shopSurface: "",        // Boutique
    productCategories: "",  // Boutique
    bdId: bdevFromUrl,      // ID Business Développeur (pré-rempli depuis l'URL)
  });
  const [galleryPhotos, setGalleryPhotos] = useState<Array<{ file: File; preview: string }>>([]);
  const [coverPhotoIndex, setCoverPhotoIndex] = useState<number | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const { data: myCompanies, isLoading: loadingCompany } = trpc.transport.myCompanies.useQuery(undefined, {
    enabled: !!user,
  });
  // Première compagnie (pour compatibilité)
  const myCompany = myCompanies?.[0] ?? null;

  const uploadGalleryImageMutation = trpc.photos.uploadGalleryImage.useMutation();

  const registerMutation = trpc.transport.register.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
  });

  const cities = getCitiesByCountry(countryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    type ActivityTypeEnum = "transport" | "restauration" | "expedition" | "hotel" | "boutique" | "agence_voyage" | "residence_meuble" | "loisirs" | "location_vente";
    const safeActivityType = activityType as ActivityTypeEnum;

    // Upload cover photo if selected
    let galleryImageUrl: string | undefined;
    if (coverPhotoIndex !== null && galleryPhotos[coverPhotoIndex]) {
      setUploadingPhotos(true);
      try {
        const file = galleryPhotos[coverPhotoIndex].file;
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64 = (event.target?.result as string).split(',')[1];
          try {
            const result = await uploadGalleryImageMutation.mutateAsync({
              base64: base64 || '',
              mimeType: file.type,
            });
            galleryImageUrl = result.url;
            // Submit form with gallery image URL
            registerMutation.mutate({
              companyName: form.companyName,
              managerName: form.managerName || undefined,
              phone: form.phone || undefined,
              email: form.email || undefined,
              address: form.address || undefined,
              countryId,
              cityId: form.cityId ? parseInt(form.cityId) : undefined,
              description: form.description || undefined,
              activityType: safeActivityType,
              bdId: form.bdId || undefined,
            });
            setUploadingPhotos(false);
          } catch (error) {
            console.error('Upload error:', error);
            setUploadingPhotos(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('File reading error:', error);
        setUploadingPhotos(false);
      }
    } else {
      // Submit form without gallery image
      registerMutation.mutate({
        companyName: form.companyName,
        managerName: form.managerName || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        countryId,
        cityId: form.cityId ? parseInt(form.cityId) : undefined,
        description: form.description || undefined,
        activityType: safeActivityType,
        bdId: form.bdId || undefined,
      });
    }
  };
  if (loading || loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
              <Bus className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl">{t("register", "title")}</CardTitle>
            <CardDescription>
              {t("register", "subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {t("register", "login")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already registered — show all companies + option to create another
  if (myCompanies && myCompanies.length > 0 && !showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Mes compagnies</h1>
            <p className="text-gray-500 text-sm mt-1">Vous avez {myCompanies.length} compagnie(s) enregistrée(s)</p>
          </div>
          {myCompanies.map((company) => (
            <Card key={company.id} className="shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Bus className="h-6 w-6 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{company.companyName}</CardTitle>
                    <CardDescription className="capitalize">{company.activityType}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {company.status === "pending" && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-800">{t("register", "pendingTitle")}</p>
                  </div>
                )}
                {company.status === "active" && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      <p className="text-sm text-green-800">{t("register", "activeTitle")}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => navigate("/transport/dashboard")}
                    >
                      {t("register", "goToDashboard")}
                    </Button>
                  </div>
                )}
                {company.status === "rejected" && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm text-red-800">{t("register", "rejectedTitle")}</p>
                      {company.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">{company.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                )}
                {company.status === "suspended" && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <XCircle className="h-5 w-5 text-gray-500 shrink-0" />
                    <p className="text-sm text-gray-800">{t("register", "suspendedTitle")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {/* Bouton pour créer une nouvelle compagnie */}
          <div className="text-center pt-4">
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white px-8"
              onClick={() => setShowForm(true)}
            >
              <Bus className="mr-2 h-4 w-4" />
              Créer une nouvelle compagnie
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500">
            <Bus className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t("register", "title")}</h1>
          <p className="mt-2 text-gray-600">{t("register", "formSubtitle")}</p>
          {/* SE CONNECTER button for existing users */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="text-sm text-gray-500">Vous avez déjà un compte ?</span>
            <Button
              variant="outline"
              size="sm"
              className="border-orange-400 text-orange-600 hover:bg-orange-50 font-semibold"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              <LogIn className="mr-2 h-4 w-4" />
              SE CONNECTER
            </Button>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            t("register", "step1"),
            t("register", "step2"),
            t("register", "step3"),
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  i === 0 ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm ${i === 0 ? "font-semibold text-orange-600" : "text-gray-400"}`}>{step}</span>
              {i < 2 && <div className="h-px w-8 bg-gray-300" />}
            </div>
          ))}
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>{t("register", "formTitle")}</CardTitle>
            <CardDescription>{t("register", "formDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Activity type selector */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t("register", "activityType")} *</Label>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                  {([
                    { value: "transport", label: t("activity", "transport"), icon: <Bus className="h-5 w-5" />, color: "orange" },
                    { value: "restauration", label: t("activity", "restaurant"), icon: <UtensilsCrossed className="h-5 w-5" />, color: "amber" },
                    { value: "expedition", label: t("activity", "expedition"), icon: <Package className="h-5 w-5" />, color: "blue" },
                    { value: "hotel", label: "Hôtel", icon: <Hotel className="h-5 w-5" />, color: "purple" },
                    { value: "boutique", label: "Boutique", icon: <ShoppingBag className="h-5 w-5" />, color: "pink" },
                    { value: "agence_voyage", label: "Agence Voyage", icon: <Plane className="h-5 w-5" />, color: "sky" },
                    { value: "residence_meuble", label: t("activity", "residenceMeuble"), icon: <Home className="h-5 w-5" />, color: "amber" },
                    { value: "loisirs", label: t("activity", "loisirs"), icon: <Gamepad2 className="h-5 w-5" />, color: "green" },
                    { value: "location_vente", label: t("activity", "locationVente"), icon: <Warehouse className="h-5 w-5" />, color: "red" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setActivityType(opt.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        activityType === opt.value
                          ? opt.color === "orange"
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : opt.color === "amber"
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : opt.color === "purple"
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : opt.color === "pink"
                            ? "border-pink-500 bg-pink-50 text-pink-700"
                            : opt.color === "sky"
                            ? "border-sky-500 bg-sky-50 text-sky-700"
                            : opt.color === "green"
                            ? "border-green-500 bg-green-50 text-green-700"
                            : opt.color === "red"
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-teal-500 bg-teal-50 text-teal-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {opt.icon}
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="companyName">{t("register", "companyName")} *</Label>
                  <Input
                    id="companyName"
                    placeholder="Ex: Compagnie Trans-Afrique"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="managerName">{t("register", "managerName")}</Label>
                  <Input
                    id="managerName"
                    placeholder="Nom et prénoms"
                    value={form.managerName}
                    onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t("register", "phone")}</Label>
                  <Input
                    id="phone"
                    placeholder="+225 07 00 00 00 00"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t("register", "email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@compagnie.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("register", "country")}</Label>
                  <Select
                    value={String(countryId)}
                    onValueChange={(v) => {
                      setCountryId(parseInt(v));
                      setForm({ ...form, cityId: "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{t("register", "city")}</Label>
                  <Select value={form.cityId} onValueChange={(v) => setForm({ ...form, cityId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("search", "allCities")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="address">{t("register", "address")}</Label>
                  <Input
                    id="address"
                    placeholder="Quartier, rue, numéro..."
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="description">{t("register", "description")}</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez vos activités, vos lignes principales, votre expérience..."
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* ─── Champs spécifiques par type d'activité ─── */}
              {activityType !== "transport" && activityType !== "expedition" && (
                <div className="border-t border-dashed border-orange-200 pt-4">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">
                    Informations spécifiques — {activityType === "restauration" ? "Restaurant" : activityType === "hotel" ? "Hôtel" : activityType === "boutique" ? "Boutique" : "Agence de Voyage"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* RESTAURATION */}
                    {activityType === "restauration" && (
                      <>
                        <div className="space-y-1.5">
                          <Label>Capacité d'accueil (nombre de couverts)</Label>
                          <Input type="number" min="1" placeholder="Ex: 50" value={form.seatingCapacity} onChange={(e) => setForm({ ...form, seatingCapacity: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Type de cuisine</Label>
                          <Select value={form.productCategories} onValueChange={(v) => setForm({ ...form, productCategories: v })}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="africaine">Cuisine africaine</SelectItem>
                              <SelectItem value="internationale">Cuisine internationale</SelectItem>
                              <SelectItem value="fast_food">Fast-food / Snack</SelectItem>
                              <SelectItem value="pizza_burger">Pizza / Burger</SelectItem>
                              <SelectItem value="asiatique">Cuisine asiatique</SelectItem>
                              <SelectItem value="mixte">Mixte</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <input
                            type="checkbox"
                            id="deliveryAvailable"
                            checked={form.deliveryAvailable}
                            onChange={(e) => setForm({ ...form, deliveryAvailable: e.target.checked })}
                            className="h-4 w-4 accent-amber-500"
                          />
                          <Label htmlFor="deliveryAvailable" className="cursor-pointer text-amber-800">Proposer la livraison à domicile</Label>
                        </div>
                      </>
                    )}

                    {/* HÔTEL */}
                    {activityType === "hotel" && (
                      <>
                        <div className="space-y-1.5">
                          <Label>Nombre de chambres</Label>
                          <Input type="number" min="1" placeholder="Ex: 30" value={form.roomCount} onChange={(e) => setForm({ ...form, roomCount: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Classement (étoiles)</Label>
                          <Select value={form.starRating} onValueChange={(v) => setForm({ ...form, starRating: v })}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 ★</SelectItem>
                              <SelectItem value="2">2 ★★</SelectItem>
                              <SelectItem value="3">3 ★★★</SelectItem>
                              <SelectItem value="4">4 ★★★★</SelectItem>
                              <SelectItem value="5">5 ★★★★★</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label>Services disponibles</Label>
                          <div className="flex flex-wrap gap-2">
                            {["Restaurant", "Piscine", "Pressing", "Spa", "Salle de conférence", "Parking", "Wi-Fi", "Room service"].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  const current = form.productCategories.split(",").filter(Boolean);
                                  const idx = current.indexOf(s);
                                  if (idx >= 0) current.splice(idx, 1); else current.push(s);
                                  setForm({ ...form, productCategories: current.join(",") });
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  form.productCategories.includes(s)
                                    ? "bg-purple-500 text-white border-purple-500"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-purple-300"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* BOUTIQUE */}
                    {activityType === "boutique" && (
                      <>
                        <div className="space-y-1.5">
                          <Label>Surface de vente (m²)</Label>
                          <Input type="number" min="1" placeholder="Ex: 80" value={form.shopSurface} onChange={(e) => setForm({ ...form, shopSurface: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Catégorie principale</Label>
                          <Select value={form.productCategories} onValueChange={(v) => setForm({ ...form, productCategories: v })}>
                            <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="alimentation">Alimentation / Épicerie</SelectItem>
                              <SelectItem value="vetements">Vêtements / Mode</SelectItem>
                              <SelectItem value="electronique">Electronique / High-tech</SelectItem>
                              <SelectItem value="cosmetique">Cosmétique / Beauté</SelectItem>
                              <SelectItem value="pharmacie">Pharmacie / Santé</SelectItem>
                              <SelectItem value="bricolage">Bricolage / Matériaux</SelectItem>
                              <SelectItem value="librairie">Librairie / Papeterie</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {/* AGENCE DE VOYAGE */}
                    {activityType === "agence_voyage" && (
                      <>
                        <div className="space-y-1.5">
                          <Label>Code IATA (si agréé)</Label>
                          <Input placeholder="Ex: CI-AGV-001" value={form.iataCode} onChange={(e) => setForm({ ...form, iataCode: e.target.value })} />
                          <p className="text-xs text-gray-400">Laissez vide si vous n'avez pas encore de code IATA</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Numéro d'agrément / licence</Label>
                          <Input placeholder="Ex: AGT-CI-2024-042" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
                        </div>
                        <div className="sm:col-span-2 space-y-1.5">
                          <Label>Types de services proposés</Label>
                          <div className="flex flex-wrap gap-2">
                            {["Billets avion", "Forfaits tout inclus", "Visa & formalités", "Location de voiture", "Transferts aéroport", "Séjours hôtel", "Voyages de groupe", "Voyages d'affaires"].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  const current = form.productCategories.split(",").filter(Boolean);
                                  const idx = current.indexOf(s);
                                  if (idx >= 0) current.splice(idx, 1); else current.push(s);
                                  setForm({ ...form, productCategories: current.join(",") });
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  form.productCategories.includes(s)
                                    ? "bg-sky-500 text-white border-sky-500"
                                    : "bg-white text-gray-600 border-gray-300 hover:border-sky-300"
                                }`}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                  </div>
                </div>
              )}

              {/* ─── Code Business Développeur ─── */}
              <div className="border-t border-dashed border-blue-200 pt-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                  Code Business Développeur (optionnel)
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="bdId">ID de votre Business Développeur</Label>
                  <div className="relative">
                    <Input
                      id="bdId"
                      placeholder="Ex: BD-A1B2C3"
                      value={form.bdId}
                      onChange={(e) => setForm({ ...form, bdId: e.target.value.toUpperCase() })}
                      className="font-mono tracking-widest"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Si vous avez été recruté par un Business Développeur HUB_RESA, saisissez son identifiant unique pour lui attribuer votre inscription.
                  </p>
                </div>
              </div>

              {/* ─── Galerie de Photos ─── */}
              <GalleryPhotoUpload
                photos={galleryPhotos}
                coverPhotoIndex={coverPhotoIndex}
                onPhotosChange={setGalleryPhotos}
                onCoverPhotoChange={setCoverPhotoIndex}
              />

              {registerMutation.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {registerMutation.error.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/")}
                >
                  {t("booking", "cancel")}
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={registerMutation.isPending || !form.companyName}
                >
                  {registerMutation.isPending ? t("common", "loading") : t("register", "submit")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
