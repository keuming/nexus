/**
 * BDevRegister.tsx — Formulaire de création de compte Business Développeur
 * Route : /bdev/register
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, User, Phone, Mail, Lock, Globe, Briefcase } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+225", label: "🇨🇮 +225 Côte d'Ivoire" },
  { code: "+221", label: "🇸🇳 +221 Sénégal" },
  { code: "+223", label: "🇲🇱 +223 Mali" },
  { code: "+226", label: "🇧🇫 +226 Burkina Faso" },
  { code: "+228", label: "🇹🇬 +228 Togo" },
  { code: "+229", label: "🇧🇯 +229 Bénin" },
  { code: "+224", label: "🇬🇳 +224 Guinée" },
  { code: "+237", label: "🇨🇲 +237 Cameroun" },
  { code: "+242", label: "🇨🇬 +242 Congo" },
  { code: "+33", label: "🇫🇷 +33 France" },
];

export default function BDevRegister() {
  const [, navigate] = useLocation();
  const [success, setSuccess] = useState<{ bdId: string } | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    contact: "",
    email: "",
    whatsapp: "",
    countryCode: "+225",
    loginPhone: "",
    pin: "",
    pinConfirm: "",
  });

  const register = trpc.businessDev.register.useMutation({
    onSuccess: (data) => {
      setSuccess({ bdId: data.bdId });
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.pin !== form.pinConfirm) {
      setError("Les codes PIN ne correspondent pas.");
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setError("Le code PIN doit contenir exactement 4 chiffres.");
      return;
    }
    register.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      contact: form.contact || undefined,
      email: form.email,
      whatsapp: form.whatsapp || undefined,
      countryCode: form.countryCode,
      loginPhone: form.loginPhone,
      pin: form.pin,
    });
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/80 border-slate-700 text-white">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Compte créé avec succès !</h2>
              <p className="text-slate-400 text-sm">Votre demande est en attente de validation par l'administration NEXUS.</p>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
              <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Votre identifiant BDev</p>
              <p className="text-4xl font-black text-orange-400 tracking-widest">{success.bdId}</p>
              <p className="text-slate-500 text-xs mt-2">Conservez cet ID — il sera demandé aux compagnies que vous recrutez.</p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/bdev/login")}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              >
                Se connecter
              </Button>
              <Link href="/">
                <Button variant="ghost" className="w-full text-slate-400 hover:text-white">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider">NEXUS</p>
              <h1 className="text-white text-xl font-bold">Espace Business Développeur</h1>
            </div>
          </div>
          <p className="text-slate-400 text-sm">Créez votre compte pour commencer à recruter des compagnies partenaires.</p>
        </div>

        <Card className="bg-slate-800/80 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-orange-400" />
              Créer un compte BDev
            </CardTitle>
            <CardDescription className="text-slate-400">
              Remplissez tous les champs. Un ID unique de 7 caractères sera généré automatiquement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Identité */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Prénom *</Label>
                  <Input
                    value={form.firstName}
                    onChange={set("firstName")}
                    placeholder="Jean"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Nom *</Label>
                  <Input
                    value={form.lastName}
                    onChange={set("lastName")}
                    placeholder="Kouassi"
                    required
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Adresse email *
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="jean.kouassi@email.com"
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact secondaire
                </Label>
                <Input
                  value={form.contact}
                  onChange={set("contact")}
                  placeholder="Téléphone secondaire, adresse..."
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-slate-300">Numéro WhatsApp</Label>
                <Input
                  value={form.whatsapp}
                  onChange={set("whatsapp")}
                  placeholder="+225 07 00 00 00 00"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Login */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-slate-300 text-sm font-medium mb-3 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-orange-400" /> Identifiants de connexion
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Indicatif pays *</Label>
                    <Select value={form.countryCode} onValueChange={(v) => setForm((p) => ({ ...p, countryCode: v }))}>
                      <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {COUNTRY_CODES.map((c) => (
                          <SelectItem key={c.code} value={c.code} className="text-white hover:bg-slate-700">
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-slate-300">Numéro de téléphone (login) *</Label>
                    <Input
                      value={form.loginPhone}
                      onChange={set("loginPhone")}
                      placeholder="0700000000"
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <p className="text-slate-500 text-xs mt-1.5">
                  Login : <span className="text-orange-400">{form.countryCode}{form.loginPhone || "XXXXXXXXXX"}</span>
                </p>
              </div>

              {/* PIN */}
              <div className="border-t border-slate-700 pt-4">
                <p className="text-slate-300 text-sm font-medium mb-3 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-orange-400" /> Code PIN (4 chiffres)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Code PIN *</Label>
                    <Input
                      type="password"
                      value={form.pin}
                      onChange={set("pin")}
                      placeholder="••••"
                      maxLength={4}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Confirmer le PIN *</Label>
                    <Input
                      type="password"
                      value={form.pinConfirm}
                      onChange={set("pinConfirm")}
                      placeholder="••••"
                      maxLength={4}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={register.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 text-base"
              >
                {register.isPending ? "Création en cours..." : "Créer mon compte BDev"}
              </Button>

              <p className="text-center text-slate-500 text-sm">
                Déjà un compte ?{" "}
                <Link href="/bdev/login" className="text-orange-400 hover:text-orange-300 underline">
                  Se connecter
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
