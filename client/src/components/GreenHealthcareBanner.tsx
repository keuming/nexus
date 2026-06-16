/**
 * GreenHealthcareBanner.tsx — Bannière verte pour gestion médicale Mediconnect4africa
 */
import { ExternalLink, Pill, Microscope, Truck, Building2 } from "lucide-react";

export function GreenHealthcareBanner() {
  const gestionUrl = "https://mediconnect4africa.cloud/login?expired=true";

  return (
    <div
      className="bg-gradient-to-r from-black via-gray-900 to-black rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-green-500/30 cursor-pointer hover:scale-105"
      onClick={() => window.open(gestionUrl, '_blank')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          window.open(gestionUrl, '_blank');
        }
      }}
    >
      {/* Header avec gradient vert */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 border-b border-green-500/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Mediconnect4Africa</p>
            <p className="text-green-100 text-xs">Gestion Médicale</p>
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
          onClick={() => window.open(gestionUrl, '_blank')}
          className="block w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105"
        >
          Découvrir
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
