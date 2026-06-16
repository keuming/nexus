/**
 * AdminLoginModal.tsx
 * Modal de connexion admin général (email + mot de passe).
 * Déclenché par le clic sur le mot "de" dans "Afrique de l'Ouest" du footer.
 * Distinct de la connexion compagnie (OAuth Manus).
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AdminLoginModal({ open, onClose }: AdminLoginModalProps) {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`Bienvenue, ${data.admin.displayName} !`);
      onClose();
      // Rediriger vers le dashboard NEXUS (dashboard général)
      navigate("/csn/dashboard");
    },
    onError: (err) => {
      setError(err.message || "Email ou mot de passe incorrect");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Veuillez renseigner votre email et votre mot de passe");
      return;
    }
    loginMutation.mutate({ email: email.trim(), password });
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0f1629] border border-white/10 text-white shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8751A] to-[#D06015] flex items-center justify-center shadow-lg shadow-orange-900/40">
              <Shield className="h-7 w-7 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold text-white">
            Espace Administrateur
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-sm">
            Accès réservé à l'équipe NEXUS — NEXUS
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-email" className="text-gray-300 text-sm">
              Adresse email
            </Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8751A] focus:ring-[#E8751A]/20"
              autoComplete="email"
              disabled={loginMutation.isPending}
            />
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="admin-password" className="text-gray-300 text-sm">
              Mot de passe
            </Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null); }}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8751A] focus:ring-[#E8751A]/20 pr-10"
                autoComplete="current-password"
                disabled={loginMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Bouton de connexion */}
          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-[#E8751A] hover:bg-[#D06015] text-white font-semibold py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-orange-900/30 mt-2"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connexion en cours…
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Accéder au dashboard
              </>
            )}
          </Button>
        </form>

        {/* Séparateur discret */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-center text-xs text-gray-600">
            Accès sécurisé — NEXUS © 2026 NEXUS Afrique{" "}
            <a href="/csn-dashboard" className="text-orange-500 hover:text-orange-600 underline">
              de
            </a>
            {" "}l'Ouest
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
