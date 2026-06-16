import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useClientAuth } from "@/contexts/ClientAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "./SearchableSelect";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [, navigate] = useLocation();
  const { login: clientLogin, signup: clientSignup } = useClientAuth();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Signup form
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    country: "",
    city: "",
  });

  // Mutations
  const login = trpc.clientAuth.login.useMutation({
    onSuccess: () => {
      toast.success("Connexion réussie");
      onClose();
      navigate("/client-dashboard");
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const signup = trpc.clientAuth.signup.useMutation({
    onSuccess: () => {
      toast.success("Compte créé avec succès");
      setActiveTab("login");
      setSignupData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        country: "",
        city: "",
      });
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setIsLoading(true);
    try {
      await clientLogin(loginData.email, loginData.password);
      toast.success("Connexion réussie");
      onClose();
      navigate("/client-dashboard");
    } catch (error) {
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (
      !signupData.name ||
      !signupData.email ||
      !signupData.password ||
      !signupData.confirmPassword ||
      !signupData.country ||
      !signupData.city
    ) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (signupData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      await clientSignup({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        phone: signupData.phone,
        country: signupData.country,
        city: signupData.city,
      });
      toast.success("Compte créé avec succès");
      setActiveTab("login");
      setSignupData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        country: "",
        city: "",
      });
    } catch (error) {
      toast.error("Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Accès Client</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="signup">Inscription</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Mot de passe</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="pl-10 pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={login.isPending}
            >
              {login.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Se connecter
            </Button>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup" className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <label className="text-sm font-semibold text-gray-700">Nom complet *</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Votre nom"
                  value={signupData.name}
                  onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Email *</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Mot de passe *</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className="pl-10 pr-10"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Confirmer le mot de passe *</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Téléphone</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="+225 XX XX XX XX"
                  value={signupData.phone}
                  onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Pays *</label>
              <SearchableSelect
                options={[
                  { value: "CI", label: "Côte d'Ivoire" },
                  { value: "SN", label: "Sénégal" },
                  { value: "BF", label: "Burkina Faso" },
                  { value: "ML", label: "Mali" },
                  { value: "BJ", label: "Bénin" },
                  { value: "TG", label: "Togo" },
                  { value: "NE", label: "Niger" },
                  { value: "GH", label: "Ghana" },
                ]}
                value={signupData.country}
                onChange={(value) => setSignupData({ ...signupData, country: value })}
                placeholder="Sélectionner un pays"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Ville *</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Votre ville"
                  value={signupData.city}
                  onChange={(e) => setSignupData({ ...signupData, city: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              onClick={handleSignup}
              className="w-full bg-orange-500 hover:bg-orange-600"
              disabled={signup.isPending}
            >
              {signup.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              S'inscrire
            </Button>

            <p className="text-xs text-gray-500 text-center">
              * Champs obligatoires
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
