/**
 * MediconnectAdBanner.tsx — Bannière publicitaire pour Mediconnect4africa
 * Affichée de part et d'autre de la galerie de compagnies
 * Couleurs : vert sur noir (identité Mediconnect4africa)
 */
import { ExternalLink, Heart, Calendar, Video } from "lucide-react";
import { useState } from "react";

interface MediconnectAdBannerProps {
  position?: "left" | "right";
  className?: string;
}

export function MediconnectAdBanner({ position = "left", className = "" }: MediconnectAdBannerProps) {
  const mediconnectUrl = "https://rdv.mediconnect4africa.cloud/";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`w-[90%] md:w-[70%] mx-auto bg-black rounded-lg overflow-hidden shadow-lg transition-all duration-300 border border-green-500/30 cursor-pointer ${
        isHovered
          ? "shadow-2xl shadow-green-500/50 scale-105 border-green-500/60"
          : "shadow-lg shadow-black/20"
      } ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => window.open(mediconnectUrl, '_blank')}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          window.open(mediconnectUrl, '_blank');
        }
      }}
    >
      {/* Header avec gradient */}
      <div className={`bg-gradient-to-r from-black via-gray-900 to-black p-4 border-b border-green-500/30 transition-all duration-300 ${
        isHovered ? "via-gray-800" : "via-gray-900"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isHovered ? "scale-110" : "scale-100"
          }`}>
            <span className="text-black font-bold text-sm">M</span>
          </div>
          <div>
            <p className={`font-bold text-sm transition-all duration-300 ${
              isHovered ? "text-green-300" : "text-green-400"
            }`}>Mediconnect4Africa</p>
            <p className={`text-xs transition-all duration-300 ${
              isHovered ? "text-gray-300" : "text-gray-400"
            }`}>Santé en ligne</p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="p-4 space-y-4">
        {/* Titre */}
        <h3 className={`font-bold text-sm leading-tight transition-all duration-300 ${
          isHovered ? "text-green-300" : "text-white"
        }`}>
          Prenez rendez-vous avec vos médecins
        </h3>

        {/* Description */}
        <p className={`text-xs leading-relaxed transition-all duration-300 ${
          isHovered ? "text-gray-200" : "text-gray-300"
        }`}>
          Accédez à des consultations médicales en ligne et en présentiel. Disponible dans toute l'Afrique.
        </p>

        {/* Features */}
        <div className="space-y-2.5">
          <div className={`flex items-start gap-2 transition-all duration-300 ${
            isHovered ? "translate-x-1" : "translate-x-0"
          }`}>
            <Calendar className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-all duration-300 ${
              isHovered ? "text-green-300 scale-110" : "text-green-400 scale-100"
            }`} />
            <p className={`text-xs transition-all duration-300 ${
              isHovered ? "text-gray-200" : "text-gray-300"
            }`}>Rendez-vous simples et rapides</p>
          </div>
          <div className={`flex items-start gap-2 transition-all duration-300 ${
            isHovered ? "translate-x-1" : "translate-x-0"
          }`}>
            <Heart className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-all duration-300 ${
              isHovered ? "text-green-300 scale-110" : "text-green-400 scale-100"
            }`} />
            <p className={`text-xs transition-all duration-300 ${
              isHovered ? "text-gray-200" : "text-gray-300"
            }`}>Suivi médical personnalisé</p>
          </div>
          <div className={`flex items-start gap-2 transition-all duration-300 ${
            isHovered ? "translate-x-1" : "translate-x-0"
          }`}>
            <Video className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-all duration-300 ${
              isHovered ? "text-green-300 scale-110" : "text-green-400 scale-100"
            }`} />
            <p className={`text-xs transition-all duration-300 ${
              isHovered ? "text-gray-200" : "text-gray-300"
            }`}>Téléconsultations disponibles</p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => window.open(mediconnectUrl, '_blank')}
          className={`block w-full font-bold py-2.5 px-3 rounded-lg text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            isHovered
              ? "bg-green-400 text-black scale-105 shadow-lg shadow-green-500/50"
              : "bg-green-500 text-black hover:bg-green-600"
          }`}
        >
          Découvrir
          <ExternalLink className={`h-3.5 w-3.5 transition-all duration-300 ${
            isHovered ? "rotate-45" : "rotate-0"
          }`} />
        </button>

        {/* Badge */}
        <div className={`pt-2 border-t transition-all duration-300 ${
          isHovered ? "border-green-500/40" : "border-green-500/20"
        }`}>
          <p className={`text-xs text-center transition-all duration-300 ${
            isHovered ? "text-green-300" : "text-gray-400"
          }`}>
            ✓ Partenaire de confiance
          </p>
        </div>
      </div>

      {/* Accent line */}
      <div className={`h-1 bg-gradient-to-r from-green-500 via-green-400 to-green-500 transition-all duration-300 ${
        isHovered ? "h-2" : "h-1"
      }`} />
    </div>
  );
}
