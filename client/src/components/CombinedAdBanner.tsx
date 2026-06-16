/**
 * CombinedAdBanner.tsx — Bannière publicitaire unique combinant Mediconnect4africa services
 */
import { ExternalLink, Stethoscope, Pill, Microscope, Truck, Building2, Clock } from "lucide-react";

export function CombinedAdBanner() {
  const rdvUrl = "https://rdv.mediconnect4africa.cloud/";
  const gestionUrl = "https://mediconnect4africa.cloud/login?expired=true";

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-black via-gray-900 to-black rounded-lg overflow-hidden shadow-lg border border-green-500/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Mediconnect4Africa</h2>
              <p className="text-gray-200 text-sm">Plateforme Complète de Santé</p>
            </div>
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Contenu principal - 2 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Colonne 1 : Rendez-vous médicaux */}
          <a
            href={rdvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="bg-black/40 border border-green-500/30 rounded-lg p-4 hover:border-green-500/60 transition-all duration-300 h-full">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="text-green-400 font-bold text-sm">Rendez-vous Médicaux</h3>
                  <p className="text-gray-400 text-xs">Santé en ligne</p>
                </div>
              </div>

              <p className="text-gray-300 text-xs mb-3 leading-relaxed">
                Prenez rendez-vous avec vos médecins, accédez à des consultations en ligne et au suivi médical personnalisé.
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <Stethoscope className="h-3.5 w-3.5 text-green-400" />
                  <span>Consultations médicales</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <Clock className="h-3.5 w-3.5 text-green-400" />
                  <span>Rendez-vous simples et rapides</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-green-500/20">
                <span className="text-green-400 text-xs font-semibold">Accéder</span>
                <ExternalLink className="h-3.5 w-3.5 text-green-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* Colonne 2 : Gestion médicale */}
          <a
            href={gestionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <div className="bg-black/40 border border-blue-500/30 rounded-lg p-4 hover:border-blue-500/60 transition-all duration-300 h-full">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-blue-400 font-bold text-sm">Gestion Médicale</h3>
                  <p className="text-gray-400 text-xs">Plateforme intégrée</p>
                </div>
              </div>

              <p className="text-gray-300 text-xs mb-3 leading-relaxed">
                Gérez cliniques, pharmacies, laboratoires, centres d'imagerie et livraison de médicaments sur ordonnance.
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <Pill className="h-3.5 w-3.5 text-blue-400" />
                  <span>Pharmacies & Ordonnances</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <Microscope className="h-3.5 w-3.5 text-blue-400" />
                  <span>Laboratoires & Imagerie</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-xs">
                  <Truck className="h-3.5 w-3.5 text-blue-400" />
                  <span>Livraison de médicaments</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-blue-500/20">
                <span className="text-blue-400 text-xs font-semibold">Accéder</span>
                <ExternalLink className="h-3.5 w-3.5 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="bg-black/60 px-6 py-3 border-t border-gray-700">
          <p className="text-gray-400 text-xs text-center">
            ✓ Partenaire de confiance pour votre santé en Afrique de l'Ouest
          </p>
        </div>
      </div>
    </div>
  );
}
