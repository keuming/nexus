/**
 * Conditions.tsx — Page publique des Conditions Générales d'Utilisation
 * Affiche les conditions d'utilisation, tarifs, frais, commissions et processus d'inscription
 */

import { useSEO } from "@/hooks/useSEO";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, DollarSign, Users, FileText, Zap } from "lucide-react";

export default function Conditions() {
  const { t } = useI18n();
  useSEO({
    title: "Conditions Générales d'Utilisation — NEXUS",
    description: "Conditions générales, tarifs, frais, commissions et processus d'inscription pour NEXUS",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#E8751A] to-[#D06015] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Conditions Générales d'Utilisation</h1>
          <p className="text-lg text-white/90">
            Découvrez tous les détails sur l'utilisation de NEXUS, les tarifs, frais et processus d'inscription
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="tarifs">Tarifs</TabsTrigger>
            <TabsTrigger value="bdev">Business Dev</TabsTrigger>
            <TabsTrigger value="inscription">Inscription</TabsTrigger>
          </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#E8751A]" />
                  Conditions Générales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-700">
                <section className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-lg mb-2 text-blue-900">Informations Légales</h3>
                  <div className="space-y-1 text-sm text-blue-900">
                    <p><strong>Produit :</strong> NEXUS</p>
                    <p><strong>Société :</strong> Compagnie des Services Numériques (CSN)</p>
                    <p><strong>Gérant :</strong> Monsieur Remi Keumingo</p>
                    <p><strong>Siège Social :</strong> Abidjan Cocody Rivièra 2 Drogba, face au Groupe Scolaire André Malraux</p>
                    <p><strong>Capital Social :</strong> 10 000 000 FCFA</p>
                    <p><strong>Immatriculation :</strong> CI-ABJ-03-2022-B12-04961</p>
                    <p><strong>Téléphone :</strong> +225 27 22 53 55 44 / +225 07 07 40 07 16 / +225 05 04 92 10 96</p>
                    <p><strong>Email :</strong> support@hubresa.cloud</p>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">1. Objet</h3>
                  <p>
                    NEXUS est une plateforme multi-services de réservation et de gestion pour compagnies de transport,
                    hôtels, agences de voyage et boutiques en Côte d'Ivoire et en Afrique de l'Ouest.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">2. Inscription et Compte</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>L'inscription est gratuite pour tous les utilisateurs</li>
                    <li>Chaque compagnie doit fournir des informations exactes et à jour</li>
                    <li>Les comptes inactifs pendant 12 mois peuvent être désactivés</li>
                    <li>NEXUS se réserve le droit de suspendre ou fermer un compte en cas de violation</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">3. Responsabilités</h3>
                  <p>
                    NEXUS fournit une plateforme de mise en relation. Les compagnies sont responsables de :
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>La qualité des services proposés</li>
                    <li>Le respect des lois locales et internationales</li>
                    <li>La gestion de leurs clients et transactions</li>
                    <li>La sécurité des données de leurs clients</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">4. Propriété Intellectuelle</h3>
                  <p>
                    Tous les contenus, logos et marques de NEXUS sont protégés par le droit d'auteur. Toute reproduction
                    sans autorisation est interdite.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">5. Limitation de Responsabilité</h3>
                  <p>
                    NEXUS n'est pas responsable des dommages indirects, pertes de données ou interruptions de service
                    causées par des tiers ou des circonstances hors de son contrôle.
                  </p>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-2">6. Modification des Conditions</h3>
                  <p>
                    NEXUS se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront notifiés
                    des modifications importantes.
                  </p>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Tarifs */}
          <TabsContent value="tarifs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-[#E8751A]" />
                  Système de Tarification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="font-semibold text-lg mb-4">Système de Crédits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Valeur d'un crédit</p>
                          <p className="text-3xl font-bold text-[#E8751A]">125 FCFA</p>
                          <p className="text-xs text-gray-500 mt-2">= 1 réservation</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Montant minimum initial</p>
                          <p className="text-3xl font-bold text-[#E8751A]">10 000 FCFA</p>
                          <p className="text-xs text-gray-500 mt-2">= 80 crédits</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-4">Frais de Mise en Service</h3>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-[#E8751A] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">100 000 FCFA (frais uniques)</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Répartition : 75% pour NEXUS, 25% (25 000 FCFA) pour le Business Développeur
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-4">Exemples de Tarification</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-700">Achat 10 000 FCFA</span>
                      <span className="font-semibold text-[#E8751A]">80 crédits</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-700">Achat 50 000 FCFA</span>
                      <span className="font-semibold text-[#E8751A]">400 crédits</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-700">Achat 100 000 FCFA</span>
                      <span className="font-semibold text-[#E8751A]">800 crédits</span>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Business Développeur */}
          <TabsContent value="bdev" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#E8751A]" />
                  Programme Business Développeur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="font-semibold text-lg mb-4">Avantages du Programme</h3>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Inscription Gratuite</p>
                        <p className="text-sm text-gray-600">Aucun frais pour devenir Business Développeur</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Prime de Recrutement</p>
                        <p className="text-sm text-gray-600">25 000 FCFA par compagnie inscrite</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Commission sur Crédits</p>
                        <p className="text-sm text-gray-600">25 FCFA par crédit acheté par vos clients (20% du montant)</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Commission sur Chiffre d'Affaires</p>
                        <p className="text-sm text-gray-600">Taux configurable (défaut 5%) du CA de vos clients</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-gray-900">Salaire de Base</p>
                        <p className="text-sm text-gray-600">250 000 FCFA/mois après 100 compagnies recrutées</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-4">Exemple de Rémunération</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-gray-700">
                      <strong>Scénario :</strong> Un BDev recrute 50 compagnies qui achètent en moyenne 50 000 FCFA de crédits par mois
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Prime de recrutement (50 × 25 000 FCFA)</span>
                        <span className="font-semibold text-[#E8751A]">1 250 000 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission crédits/mois (50 × 50 000 × 20%)</span>
                        <span className="font-semibold text-[#E8751A]">500 000 FCFA</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission CA/mois (50 × 50 000 × 5%)</span>
                        <span className="font-semibold text-[#E8751A]">125 000 FCFA</span>
                      </div>
                      <div className="border-t border-blue-300 pt-2 flex justify-between">
                        <span className="font-semibold">Total mensuel</span>
                        <span className="font-bold text-[#E8751A] text-lg">625 000 FCFA</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-4">Conditions d'Accès</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Être résident en Côte d'Ivoire ou en Afrique de l'Ouest</li>
                    <li>Avoir une adresse email valide et un numéro de téléphone</li>
                    <li>Accepter les conditions générales et la politique de confidentialité</li>
                    <li>Respecter les règles éthiques de NEXUS</li>
                  </ul>
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Inscription */}
          <TabsContent value="inscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#E8751A]" />
                  Processus d'Inscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <section>
                  <h3 className="font-semibold text-lg mb-4">Inscription Compagnie</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Cliquez sur "Créer un compte compagnie"</p>
                        <p className="text-sm text-gray-600">Sur la page d'accueil ou le carousel Recrutement</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Remplissez le formulaire</p>
                        <p className="text-sm text-gray-600">Raison sociale, contact, adresse, secteur d'activité</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Entrez l'ID Business Développeur (optionnel)</p>
                        <p className="text-sm text-gray-600">Format : BD-XXXXX (si vous avez été recruté par un BDev)</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Validez et accédez à votre dashboard</p>
                        <p className="text-sm text-gray-600">Votre compte est en attente de validation par NEXUS</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        5
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Achetez vos premiers crédits</p>
                        <p className="text-sm text-gray-600">Minimum 10 000 FCFA pour commencer à recevoir des réservations</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-4">Inscription Business Développeur</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Cliquez sur "Devenir BDev"</p>
                        <p className="text-sm text-gray-600">Dans le carousel Recrutement en cours</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Remplissez vos informations personnelles</p>
                        <p className="text-sm text-gray-600">Nom, prénoms, contact, email, WhatsApp</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Définissez votre login et code PIN</p>
                        <p className="text-sm text-gray-600">Code PIN 4 chiffres pour la connexion sécurisée</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        4
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Recevez votre ID unique (BD-XXXXX)</p>
                        <p className="text-sm text-gray-600">Généré automatiquement lors de votre inscription</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-[#E8751A] text-white rounded-full flex items-center justify-center font-bold">
                        5
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Partagez votre ID avec vos clients</p>
                        <p className="text-sm text-gray-600">Vos clients l'entrent lors de leur inscription pour être rattachés à vous</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="font-semibold text-lg mb-4">Support et Contact</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-3">
                      Pour toute question ou assistance, veuillez contacter :
                    </p>
                    <div className="space-y-2 text-sm">
                      <p><strong>Email :</strong> support@hubresa.cloud</p>
                      <p><strong>Téléphone :</strong> +225 0504921096</p>
                      <p><strong>WhatsApp :</strong> +225 0504921096</p>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
