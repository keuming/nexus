/**
 * HealthcareManagementBanner.tsx — Bannière publicitaire pour Mediconnect4africa (Gestion)
 * Application de gestion complète des cliniques, pharmacies, centres d'imagerie, laboratoires
 */
import { ExternalLink, Building2, Pill, Microscope, Truck, Stethoscope } from "lucide-react";

interface HealthcareManagementBannerProps {
  className?: string;
}

export function HealthcareManagementBanner({ className = "" }: HealthcareManagementBannerProps) {
  // Créer une deuxième instance avec position "right" pour la galerie
  const managementUrl = "https://mediconnect4africa.cloud/login?expired=true";

  return (
    <div
      className={`w-[90%] md:w-[70%] mx-auto bg-black rounded-lg overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 border border-green-500/30 hover:border-green-500/60 cursor-pointer ${className}`}
      onClick={() => window.open(managementUrl, '_blank')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          window.open(managementUrl, '_blank');
        }
      }}
    >
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black p-4 border-b border-green-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <Stethoscope className="h-5 w-5 text-black" />
          </div>
          <div>
            <p className="text-green-400 font-bold text-sm">Mediconnect4Africa</p>
            <p className="text-gray-400 text-xs">Gestion Médicale</p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-4">
        {/* Titre */}
        <h3 className="text-white font-bold text-sm leading-tight">
          Gérez vos établissements médicaux
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-xs leading-relaxed">
          Plateforme complète pour cliniques, pharmacies, laboratoires et centres d'imagerie.
        </p>

        {/* Features */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300 text-xs">Gestion des cliniques et pharmacies</p>
          </div>
          <div className="flex items-start gap-2">
            <Microscope className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300 text-xs">Centres d'imagerie et laboratoires</p>
          </div>
          <div className="flex items-start gap-2">
            <Pill className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300 text-xs">Gestion des ordonnances</p>
          </div>
          <div className="flex items-start gap-2">
            <Truck className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-300 text-xs">Livraison de médicaments</p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => window.open(managementUrl, '_blank')}
          className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
        >
          Accéder
          <ExternalLink className="h-3.5 w-3.5" />
        </button>

        {/* Badge */}
        <div className="pt-2 border-t border-green-500/20">
          <p className="text-gray-400 text-xs text-center">
            ✓ Solution intégrée
          </p>
        </div>
      </div>

      {/* Accent line */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500" />
    </div>
  );
}
