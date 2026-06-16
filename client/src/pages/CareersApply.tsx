/**
 * CareersApply — Page dédiée au programme de recrutement Business Développeur
 * Affiche l'annonce de poste et le formulaire de candidature enrichi
 */
import { useState } from "react";
import RecruitmentForm from "@/components/RecruitmentForm";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  TrendingUp, 
  Users, 
  Globe, 
  Award, 
  CheckCircle2,
  ArrowLeft,
  Target
} from "lucide-react";
import { Link } from "wouter";

export default function CareersApply() {
  const [formOpen, setFormOpen] = useState(false);
  useSEO({
    title: "Recrutement Business Développeur — NEXUS",
    description: "Rejoignez NEXUS en tant que Business Développeur. Commission attractive, réseau panafricain dans 16 pays. Postulez en ligne avec votre CV et lettre de motivation.",
    keywords: "recrutement NEXUS, business développeur Afrique, emploi commercial Côte d'Ivoire, offre emploi transport Afrique",
    canonicalPath: "/careers/apply",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-600">Retour à l'accueil</span>
            </a>
          </Link>
          <div className="flex items-center gap-3">
            <img 
              src="https://files.manuscdn.com/user_upload_by_module/web_dev_logo/310519663089638801/kNLObPsoKvcDcLQI.png" 
              alt="NEXUS" 
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">NEXUS</h1>
              <p className="text-xs text-gray-500">Carrières & Recrutement</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-[#1a237e] to-[#283593]">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Briefcase className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Opportunité de carrière</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Business Développeur
          </h1>
          <p className="text-xl text-white/90 mb-2">
            Rejoignez l'équipe NEXUS et développez notre réseau panafricain
          </p>
          <p className="text-white/80 max-w-2xl mx-auto mb-8">
            Nous recherchons des commerciaux motivés pour accompagner notre expansion dans 16 pays d'Afrique de l'Ouest et Centrale
          </p>
          <Button 
            size="lg" 
            className="bg-[#E8751A] hover:bg-[#D06015] text-white px-8 py-6 text-lg shadow-xl"
            onClick={() => setFormOpen(true)}
          >
            Postuler maintenant
          </Button>
        </div>
      </section>

      {/* Mission & Avantages */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Mission */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8751A]">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Votre Mission</h2>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#E8751A] mt-0.5 flex-shrink-0" />
                  <span>Identifier et prospecter les entreprises cibles (transport, hôtellerie, restauration, boutiques, agences de voyage)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#E8751A] mt-0.5 flex-shrink-0" />
                  <span>Présenter la plateforme NEXUS et démontrer sa valeur ajoutée</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#E8751A] mt-0.5 flex-shrink-0" />
                  <span>Accompagner les entreprises dans leur inscription et prise en main</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#E8751A] mt-0.5 flex-shrink-0" />
                  <span>Assurer le suivi et la fidélisation des partenaires</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#E8751A] mt-0.5 flex-shrink-0" />
                  <span>Remonter les retours terrain pour améliorer la plateforme</span>
                </li>
              </ul>
            </div>

            {/* Avantages */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1a237e]">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Vos Avantages</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <span className="text-lg">💰</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Commission attractive</p>
                    <p className="text-sm text-gray-600">10 000 FCFA par compagnie inscrite et validée</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Réseau panafricain</p>
                    <p className="text-sm text-gray-600">16 pays d'Afrique de l'Ouest et Centrale</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Formation complète</p>
                    <p className="text-sm text-gray-600">Outils digitaux et accompagnement terrain</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Évolution rapide</p>
                    <p className="text-sm text-gray-600">Possibilité de devenir manager régional</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profil Recherché */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Profil Recherché
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#E8751A]" />
                  Compétences Essentielles
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Excellente aisance relationnelle et communication</li>
                  <li>• Capacité à convaincre et négocier</li>
                  <li>• Autonomie et sens de l'organisation</li>
                  <li>• Maîtrise des outils digitaux (smartphone, email)</li>
                  <li>• Mobilité sur le terrain</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[#E8751A]" />
                  Atouts Appréciés
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• Expérience en vente B2B ou prospection</li>
                  <li>• Connaissance du secteur transport/hôtellerie</li>
                  <li>• Réseau professionnel local</li>
                  <li>• Maîtrise du français (espagnol/anglais = bonus)</li>
                  <li>• Permis de conduire et véhicule personnel</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Processus de Recrutement */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Processus de Recrutement
            </h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Candidature", desc: "Remplissez le formulaire en ligne avec CV et lettre de motivation", icon: "📝" },
                { step: "2", title: "Présélection", desc: "Notre équipe examine votre profil (48-72h)", icon: "🔍" },
                { step: "3", title: "Entretien", desc: "Entretien téléphonique ou visio avec le responsable RH", icon: "💬" },
                { step: "4", title: "Intégration", desc: "Formation et démarrage de votre activité commerciale", icon: "🚀" },
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-xl p-6 border border-gray-200 text-center">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#E8751A] text-white font-bold text-sm mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-[#1a237e] to-[#283593]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à rejoindre l'aventure NEXUS ?
          </h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto">
            Postulez dès maintenant et devenez acteur de la transformation digitale du secteur tertiaire en Afrique
          </p>
          <Button 
            size="lg" 
            className="bg-[#E8751A] hover:bg-[#D06015] text-white px-10 py-6 text-lg shadow-2xl"
            onClick={() => setFormOpen(true)}
          >
            <Briefcase className="h-5 w-5 mr-2" />
            Postuler maintenant
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            Des questions ? Contactez-nous : <a href="mailto:recrutement@nexus.africa" className="text-[#E8751A] font-medium hover:underline">recrutement@nexus.africa</a>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            © 2026 NEXUS — Tous droits réservés
          </p>
        </div>
      </footer>

      {/* Formulaire de candidature */}
      <RecruitmentForm open={formOpen} onClose={() => setFormOpen(false)} />
    </div>
  );
}
