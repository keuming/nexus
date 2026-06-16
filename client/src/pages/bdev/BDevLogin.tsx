/**
 * BDevLogin.tsx — Connexion Business Développeur par téléphone + PIN
 * Route : /bdev/login
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
import { LogIn, Briefcase, Phone, Lock } from "lucide-react";

const COUNTRY_CODES = [
  { code: "+225", label: "🇨🇮 +225" },
  { code: "+221", label: "🇸🇳 +221" },
  { code: "+223", label: "🇲🇱 +223" },
  { code: "+226", label: "🇧🇫 +226" },
  { code: "+228", label: "🇹🇬 +228" },
  { code: "+229", label: "🇧🇯 +229" },
  { code: "+224", label: "🇬🇳 +224" },
  { code: "+237", label: "🇨🇲 +237" },
  { code: "+242", label: "🇨🇬 +242" },
  { code: "+33", label: "🇫🇷 +33" },
];

const BDEV_TOKEN_KEY = "bdev_token";

export function getBdevToken(): string | null {
  return localStorage.getItem(BDEV_TOKEN_KEY);
}

export function setBdevToken(token: string) {
  localStorage.setItem(BDEV_TOKEN_KEY, token);
}

export function clearBdevToken() {
  localStorage.removeItem(BDEV_TOKEN_KEY);
}

export default function BDevLogin() {
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    countryCode: "+225",
    loginPhone: "",
    pin: "",
  });

  const login = trpc.businessDev.login.useMutation({
    onSuccess: (data) => {
      setBdevToken(data.token);
      navigate("/bdev/dashboard");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate({
      countryCode: form.countryCode,
      loginPhone: form.loginPhone,
      pin: form.pin,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider">HUB_RESA</p>
              <h1 className="text-white text-xl font-bold">Espace Business Développeur</h1>
            </div>
          </div>
        </div>

        <Card className="bg-slate-800/80 border-slate-700 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <LogIn className="w-5 h-5 text-orange-400" />
              Connexion BDev
            </CardTitle>
            <CardDescription className="text-slate-400">
              Entrez votre numéro de téléphone et votre code PIN à 4 chiffres.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Téléphone */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Numéro de téléphone
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={form.countryCode}
                    onValueChange={(v) => setForm((p) => ({ ...p, countryCode: v }))}
                  >
                    <SelectTrigger className="w-28 bg-slate-700/50 border-slate-600 text-white flex-shrink-0">
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
                  <Input
                    value={form.loginPhone}
                    onChange={(e) => setForm((p) => ({ ...p, loginPhone: e.target.value }))}
                    placeholder="0700000000"
                    required
                    className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* PIN */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Code PIN (4 chiffres)
                </Label>
                <Input
                  type="password"
                  value={form.pin}
                  onChange={(e) => setForm((p) => ({ ...p, pin: e.target.value }))}
                  placeholder="••••"
                  maxLength={4}
                  required
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 text-center text-2xl tracking-widest"
                />
              </div>

              {error && (
                <Alert className="bg-red-500/10 border-red-500/30">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={login.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 text-base"
              >
                {login.isPending ? "Connexion..." : "Se connecter"}
              </Button>

              <p className="text-center text-slate-500 text-sm">
                Pas encore de compte ?{" "}
                <Link href="/bdev/register" className="text-orange-400 hover:text-orange-300 underline">
                  Créer un compte BDev
                </Link>
              </p>

              <p className="text-center">
                <Link href="/" className="text-slate-500 hover:text-slate-400 text-xs">
                  ← Retour à l'accueil
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
