import { useLocation } from "wouter";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CreditCard, FileText, Phone, Mail } from "lucide-react";

export default function Legal() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Accueil
          </Button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Mentions légales & Conditions d'utilisation</h1>
            <p className="text-xs text-gray-500">NEXUS — Plateforme NEXUS Afrique de l'Ouest</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Section 1 — Présentation */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#E8751A]" />
            <h2 className="text-xl font-bold text-gray-900">1. Présentation de la plateforme</h2>
          </div>
          <div className="bg-white rounded-xl border p-6 space-y-3 text-sm text-gray-700 leading-relaxed">
            <p>
              <strong>NEXUS</strong> est une plateforme numérique de gestion et de réservation de services (transport, restauration, expédition de colis) opérée sous l'égide du <strong>NEXUS</strong> pour les compagnies partenaires d'Afrique subsaharienne.
            </p>
            <p>
              Siège social : Abidjan, Côte d'Ivoire<br />
              Service client : <strong>+225 0504921096 / 0701578857</strong><br />
              E-mail : <strong>clients@nexus.com</strong>
            </p>
            <p>
              L'utilisation de la plateforme implique l'acceptation pleine et entière des présentes conditions générales d'utilisation (CGU).
            </p>
          </div>
        </section>

        {/* Section 2 — Conditions d'utilisation */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-[#E8751A]" />
            <h2 className="text-xl font-bold text-gray-900">2. Conditions générales d'utilisation</h2>
          </div>
          <div className="bg-white rounded-xl border p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">2.1 Accès aux services</h3>
              <p>L'accès aux services de consultation (horaires, tarifs, menus) est libre et ne nécessite aucune inscription. La création d'un compte compagnie est requise uniquement pour accéder au tableau de bord de gestion et enregistrer des transactions.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">2.2 Responsabilité des compagnies</h3>
              <p>Chaque compagnie partenaire est responsable de l'exactitude des informations publiées (horaires, tarifs, disponibilités). NEXUS ne saurait être tenu responsable des erreurs ou omissions dans les données fournies par les compagnies.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">2.3 Propriété intellectuelle</h3>
              <p>L'ensemble des contenus de la plateforme (logo, textes, interface) est la propriété exclusive de NEXUS. Toute reproduction non autorisée est interdite.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">2.4 Protection des données</h3>
              <p>Les données personnelles collectées (nom, téléphone, e-mail) sont utilisées exclusivement pour le traitement des réservations et commandes. Elles ne sont ni vendues ni transmises à des tiers sans consentement explicite.</p>
            </div>
          </div>
        </section>

        {/* Section 3 — Politique des crédits */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-[#E8751A]" />
            <h2 className="text-xl font-bold text-gray-900">3. Politique des crédits NEXUS</h2>
          </div>
          <div className="bg-white rounded-xl border p-6 space-y-4 text-sm text-gray-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">3.1 Fonctionnement du système de points</h3>
              <p>NEXUS utilise un système de crédits (points) pour facturer ses services aux compagnies partenaires. <strong>1 point est débité automatiquement</strong> pour chaque transaction enregistrée avec succès : achat de billet, réservation, commande restaurant ou colis expédié.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">3.2 Tarification</h3>
              <p>Le coût d'un point est fixé à <strong>125 FCFA</strong> (environ 0,21 USD, 0,19 EUR), converti en devise locale selon le pays de la compagnie. Les taux de conversion sont indicatifs et peuvent évoluer.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">3.3 Non-remboursabilité</h3>
              <p className="text-red-700 font-medium">Les crédits achetés ne sont pas remboursables. Toute transaction d'achat de crédits est définitive.</p>
              <p className="mt-1">En cas d'erreur technique avérée lors d'un achat de crédits, la compagnie peut contacter le support NEXUS dans un délai de 48 heures pour examen du dossier.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">3.4 Suspension de service</h3>
              <p>Lorsque le solde d'une compagnie atteint 0 point, les nouvelles transactions ne peuvent plus être enregistrées. La compagnie reçoit une alerte automatique dès que son solde passe sous 5 points.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">3.5 Validité des crédits</h3>
              <p>Les crédits achetés n'ont pas de date d'expiration. Ils restent disponibles jusqu'à leur utilisation complète.</p>
            </div>
          </div>
        </section>

        {/* Section 4 — Politique de remboursement des services */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-[#E8751A]" />
            <h2 className="text-xl font-bold text-gray-900">4. Politique de remboursement des services</h2>
          </div>
          <div className="bg-white rounded-xl border p-6 space-y-3 text-sm text-gray-700 leading-relaxed">
            <p>Les conditions de remboursement des billets, réservations et commandes sont définies par chaque compagnie partenaire et peuvent varier. NEXUS agit en tant qu'intermédiaire technique et n'est pas partie aux contrats de transport ou de service conclus entre les compagnies et leurs clients.</p>
            <p>Pour tout litige relatif à un service (retard, annulation, non-conformité), le client doit contacter directement la compagnie concernée. NEXUS peut servir de médiateur sur demande explicite des deux parties.</p>
          </div>
        </section>

        {/* Section 5 — Contact */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Phone className="h-5 w-5 text-[#E8751A]" />
            <h2 className="text-xl font-bold text-gray-900">5. Contact & Support</h2>
          </div>
          <div className="bg-white rounded-xl border p-6 grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-[#E8751A] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-gray-900">Service client</p>
                <p className="text-sm text-gray-600">+225 0504921096</p>
                <p className="text-sm text-gray-600">0701578857</p>
                <p className="text-xs text-gray-400 mt-1">Lun–Sam, 8h–18h (GMT)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-[#E8751A] mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-gray-900">E-mail</p>
                <a href="mailto:clients@nexus.com" className="text-sm text-[#E8751A] hover:underline">clients@nexus.com</a>
                <p className="text-xs text-gray-400 mt-1">Réponse sous 24–48h ouvrées</p>
              </div>
            </div>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 pb-6">
          Dernière mise à jour : Mars 2026 — © 2026 NEXUS. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
