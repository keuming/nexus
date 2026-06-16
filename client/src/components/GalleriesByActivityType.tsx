import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import CarrouselGalerie from "./CarrouselGalerie";

export const ACTIVITY_TYPES = [
  { key: "transport", label: "🚌 Transport", icon: "🚌" },
  { key: "restauration", label: "🍽️ Restauration", icon: "🍽️" },
  { key: "expedition", label: "📦 Expédition", icon: "📦" },
  { key: "hotel", label: "🏨 Hôtel", icon: "🏨" },
  { key: "boutique", label: "🛍️ Boutique", icon: "🛍️" },
  { key: "agence_voyage", label: "✈️ Agence de Voyage", icon: "✈️" },
  { key: "residence_meuble", label: "🏠 Résidence Meublée", icon: "🏠" },
  { key: "loisirs", label: "🎉 Loisirs", icon: "🎉" },
  { key: "location_vente", label: "🚗 Location & Vente", icon: "🚗" },
];

export function GalleriesByActivityType() {
  const [expandedActivity, setExpandedActivity] = useState<string | null>("transport");

  return (
    <div className="w-full bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Découvrez nos partenaires
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Explorez les meilleures compagnies par catégorie de service
        </p>

        <div className="space-y-4">
          {ACTIVITY_TYPES.map((activity) => (
            <div key={activity.key} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedActivity(
                    expandedActivity === activity.key ? null : activity.key
                  )
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activity.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {activity.label}
                  </h3>
                </div>
                {expandedActivity === activity.key ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {/* Gallery Content */}
              {expandedActivity === activity.key && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <CarrouselGalerie initialFilter={activity.key} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
