/**
 * RecruitmentForm — Formulaire de candidature enrichi pour le programme BD NEXUS
 * Champs : identité, contact, localisation, formation, expérience, secteur cible,
 *          motivation, upload CV (PDF/Word), upload lettre de motivation (PDF/Word)
 */
import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { COUNTRIES, getCitiesByCountry } from "@/lib/transport-geo";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Phone,
  Target,
  Upload,
  User,
  X,
} from "lucide-react";

const EDUCATION_LEVELS = [
  { value: "brevet", label: "Brevet / BEPC" },
  { value: "bac", label: "Baccalauréat" },
  { value: "bac+2", label: "Bac+2 (BTS, DUT)" },
  { value: "bac+3", label: "Bac+3 (Licence)" },
  { value: "bac+4", label: "Bac+4 (Master 1)" },
  { value: "bac+5", label: "Bac+5 (Master 2, Ingénieur)" },
  { value: "doctorat", label: "Doctorat" },
  { value: "autre", label: "Autre" },
] as const;

const LANGUAGES = [
  { value: "francais", label: "Français" },
  { value: "espagnol", label: "Espagnol" },
  { value: "anglais", label: "Anglais" },
] as const;

const EXPERIENCE_LEVELS = [
  { value: "aucune", label: "Aucune expérience commerciale" },
  { value: "moins_1an", label: "Moins d'1 an" },
  { value: "1_3ans", label: "1 à 3 ans" },
  { value: "3_5ans", label: "3 à 5 ans" },
  { value: "plus_5ans", label: "Plus de 5 ans" },
] as const;

const TARGET_SECTORS = [
  { value: "tous", label: "Tous les secteurs" },
  { value: "transport", label: "Transport interurbain" },
  { value: "restauration", label: "Restauration" },
  { value: "hotel", label: "Hôtellerie" },
  { value: "boutique", label: "Commerce / Boutique" },
  { value: "agence_voyage", label: "Agence de voyage" },
] as const;

interface UploadedFile {
  url: string;
  key: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function RecruitmentForm({ open, onClose }: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    country: "",
    city: "",
    educationLevel: "",
    language: "",
    experience: "",
    targetSector: "",
    motivation: "",
  });

  const [cvFile, setCvFile] = useState<UploadedFile | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<UploadedFile | null>(null);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false);

  const cvInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = COUNTRIES.find((c) => c.code === form.country);
  const cities = selectedCountry ? getCitiesByCountry(selectedCountry.id) : [];

  const submitMutation = trpc.recruitment.submit.useMutation({
    onSuccess: () => setStep("success"),
    onError: (err) => toast.error("Erreur lors de l'envoi : " + err.message),
  });

  const uploadDocument = async (file: File, type: "cv" | "cover_letter"): Promise<UploadedFile | null> => {
    const formData = new FormData();
    formData.append("document", file);
    try {
      const res = await fetch(`/api/recruitment/upload-document?type=${type}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erreur upload");
      }
      const data = await res.json();
      return { url: data.url, key: data.key, name: file.name };
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de l'upload du fichier");
      return null;
    }
  };

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCv(true);
    const result = await uploadDocument(file, "cv");
    if (result) {
      setCvFile(result);
      toast.success("CV téléchargé avec succès");
    }
    setUploadingCv(false);
    e.target.value = "";
  };

  const handleCoverLetterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCoverLetter(true);
    const result = await uploadDocument(file, "cover_letter");
    if (result) {
      setCoverLetterFile(result);
      toast.success("Lettre de motivation téléchargée avec succès");
    }
    setUploadingCoverLetter(false);
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.email ||
        !form.country || !form.city || !form.educationLevel || !form.language) {
      toast.error("Veuillez remplir tous les champs obligatoires (*).");
      return;
    }
    submitMutation.mutate({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      country: form.country,
      city: form.city,
      educationLevel: form.educationLevel as "brevet" | "bac" | "bac+2" | "bac+3" | "bac+4" | "bac+5" | "doctorat" | "autre",
      language: form.language as "francais" | "espagnol" | "anglais",
      experience: form.experience as "aucune" | "moins_1an" | "1_3ans" | "3_5ans" | "plus_5ans" | undefined || undefined,
      targetSector: form.targetSector as "transport" | "restauration" | "hotel" | "boutique" | "agence_voyage" | "tous" | undefined || undefined,
      motivation: form.motivation || undefined,
      cvUrl: cvFile?.url,
      cvKey: cvFile?.key,
      coverLetterUrl: coverLetterFile?.url,
      coverLetterKey: coverLetterFile?.key,
    });
  };

  const handleClose = () => {
    setStep("form");
    setForm({ firstName: "", lastName: "", phone: "", email: "", country: "", city: "", educationLevel: "", language: "", experience: "", targetSector: "", motivation: "" });
    setCvFile(null);
    setCoverLetterFile(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === "success" ? (
          <div className="text-center py-10 space-y-5">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Candidature envoyée !</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Merci pour votre intérêt à rejoindre l'équipe NEXUS. Notre équipe examinera
              votre candidature et vous contactera dans les meilleurs délais (48–72h ouvrées).
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800 max-w-sm mx-auto">
              <strong>Prochaine étape :</strong> Un agent NEXUS vous contactera par téléphone ou email
              pour un entretien de présélection.
            </div>
            <Button className="bg-[#E8751A] hover:bg-[#D06015] text-white px-8" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8751A]">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-gray-900">
                    Rejoindre l'équipe commerciale NEXUS
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    Devenez Business Développeur partenaire et développez notre réseau en Afrique
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Avantages */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { icon: "💰", label: "Commission attractive", sub: "10 000 FCFA / compagnie" },
                { icon: "🌍", label: "Réseau panafricain", sub: "16 pays couverts" },
                { icon: "📱", label: "Outils digitaux", sub: "Formation incluse" },
              ].map((item) => (
                <div key={item.label} className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <p className="text-xs font-semibold text-orange-800">{item.label}</p>
                  <p className="text-xs text-orange-600">{item.sub}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identité */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <User className="h-3.5 w-3.5 text-[#E8751A]" /> Prénom *
                  </Label>
                  <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="Votre prénom" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <User className="h-3.5 w-3.5 text-[#E8751A]" /> Nom *
                  </Label>
                  <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Votre nom" required />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Phone className="h-3.5 w-3.5 text-[#E8751A]" /> Téléphone *
                  </Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+225 07 00 00 00" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Mail className="h-3.5 w-3.5 text-[#E8751A]" /> Email *
                  </Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="votre@email.com" required />
                </div>
              </div>

              {/* Localisation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Globe className="h-3.5 w-3.5 text-[#E8751A]" /> Pays de résidence *
                  </Label>
                  <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v, city: "" })}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un pays" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <MapPin className="h-3.5 w-3.5 text-[#E8751A]" /> Ville *
                  </Label>
                  <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })} disabled={!form.country}>
                    <SelectTrigger><SelectValue placeholder={form.country ? "Sélectionner une ville" : "Choisir un pays d'abord"} /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Formation et langue */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <GraduationCap className="h-3.5 w-3.5 text-[#E8751A]" /> Niveau d'étude *
                  </Label>
                  <Select value={form.educationLevel} onValueChange={(v) => setForm({ ...form, educationLevel: v })}>
                    <SelectTrigger><SelectValue placeholder="Votre niveau" /></SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Languages className="h-3.5 w-3.5 text-[#E8751A]" /> Langue principale *
                  </Label>
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger><SelectValue placeholder="Votre langue" /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Expérience et secteur cible */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-[#E8751A]" /> Expérience commerciale
                  </Label>
                  <Select value={form.experience} onValueChange={(v) => setForm({ ...form, experience: v })}>
                    <SelectTrigger><SelectValue placeholder="Votre expérience" /></SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Target className="h-3.5 w-3.5 text-[#E8751A]" /> Secteur cible
                  </Label>
                  <Select value={form.targetSector} onValueChange={(v) => setForm({ ...form, targetSector: v })}>
                    <SelectTrigger><SelectValue placeholder="Secteur préféré" /></SelectTrigger>
                    <SelectContent>
                      {TARGET_SECTORS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <FileText className="h-3.5 w-3.5 text-[#E8751A]" /> Lettre de motivation (texte)
                </Label>
                <Textarea
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                  placeholder="Décrivez en quelques lignes pourquoi vous souhaitez rejoindre l'équipe NEXUS et ce qui vous qualifie pour ce poste..."
                  rows={3}
                  maxLength={2000}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400 text-right">{form.motivation.length}/2000</p>
              </div>

              {/* Upload CV */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Upload className="h-3.5 w-3.5 text-[#E8751A]" /> CV (PDF ou Word, max 5 Mo)
                </Label>
                <input
                  ref={cvInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleCvChange}
                />
                {cvFile ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm text-green-800 truncate flex-1">{cvFile.name}</span>
                    <button type="button" onClick={() => setCvFile(null)} className="text-green-600 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-gray-300 text-gray-500 hover:border-[#E8751A] hover:text-[#E8751A]"
                    onClick={() => cvInputRef.current?.click()}
                    disabled={uploadingCv}
                  >
                    {uploadingCv ? "Téléchargement en cours..." : (
                      <><Upload className="h-4 w-4 mr-2" /> Joindre mon CV</>
                    )}
                  </Button>
                )}
              </div>

              {/* Upload Lettre de motivation (fichier) */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Upload className="h-3.5 w-3.5 text-[#E8751A]" /> Lettre de motivation (fichier PDF ou Word, optionnel)
                </Label>
                <input
                  ref={coverLetterInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleCoverLetterChange}
                />
                {coverLetterFile ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <FileText className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-sm text-green-800 truncate flex-1">{coverLetterFile.name}</span>
                    <button type="button" onClick={() => setCoverLetterFile(null)} className="text-green-600 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-dashed border-gray-300 text-gray-500 hover:border-[#E8751A] hover:text-[#E8751A]"
                    onClick={() => coverLetterInputRef.current?.click()}
                    disabled={uploadingCoverLetter}
                  >
                    {uploadingCoverLetter ? "Téléchargement en cours..." : (
                      <><Upload className="h-4 w-4 mr-2" /> Joindre une lettre de motivation (fichier)</>
                    )}
                  </Button>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#E8751A] hover:bg-[#D06015] text-white gap-2"
                  disabled={submitMutation.isPending || uploadingCv || uploadingCoverLetter}
                >
                  {submitMutation.isPending ? "Envoi en cours..." : (
                    <>Soumettre ma candidature <ChevronRight className="h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
