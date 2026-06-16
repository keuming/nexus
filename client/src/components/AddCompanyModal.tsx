import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Bus,
  Utensils,
  Package,
  Hotel,
  ShoppingBag,
  Plane,
  Home,
  Gamepad2,
  Warehouse,
  X,
} from "lucide-react";
import { useLocation } from "wouter";

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITY_TYPES = [
  {
    id: "transport",
    label: "Transport",
    icon: Bus,
    color: "bg-orange-100 hover:bg-orange-200",
    textColor: "text-orange-700",
    description: "Gestion de compagnies de transport",
  },
  {
    id: "restauration",
    label: "Restauration",
    icon: Utensils,
    color: "bg-red-100 hover:bg-red-200",
    textColor: "text-red-700",
    description: "Gestion de restaurants",
  },
  {
    id: "expedition",
    label: "Expédition",
    icon: Package,
    color: "bg-blue-100 hover:bg-blue-200",
    textColor: "text-blue-700",
    description: "Gestion de services d'expédition",
  },
  {
    id: "hotel",
    label: "Hôtel",
    icon: Hotel,
    color: "bg-purple-100 hover:bg-purple-200",
    textColor: "text-purple-700",
    description: "Gestion d'hôtels",
  },
  {
    id: "boutique",
    label: "Boutique",
    icon: ShoppingBag,
    color: "bg-pink-100 hover:bg-pink-200",
    textColor: "text-pink-700",
    description: "Gestion de boutiques",
  },
  {
    id: "agence_voyage",
    label: "Agence Voyage",
    icon: Plane,
    color: "bg-cyan-100 hover:bg-cyan-200",
    textColor: "text-cyan-700",
    description: "Gestion d'agences de voyage",
  },
  {
    id: "residence_meuble",
    label: "Résidence Meublée",
    icon: Home,
    color: "bg-amber-100 hover:bg-amber-200",
    textColor: "text-amber-700",
    description: "Gestion de résidences meublées",
  },
  {
    id: "loisirs",
    label: "Loisirs",
    icon: Gamepad2,
    color: "bg-green-100 hover:bg-green-200",
    textColor: "text-green-700",
    description: "Gestion d'activités de loisirs",
  },
  {
    id: "location_vente",
    label: "Location & Vente",
    icon: Warehouse,
    color: "bg-red-100 hover:bg-red-200",
    textColor: "text-red-700",
    description: "Gestion de locations et ventes",
  },
];

export default function AddCompanyModal({ open, onOpenChange }: AddCompanyModalProps) {
  const [, setLocation] = useLocation();

  const handleSelectActivity = (activityId: string) => {
    // Rediriger vers le formulaire d'inscription avec le type d'activité pré-sélectionné
    setLocation(`/register-company?activity=${activityId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Ajouter une Nouvelle Compagnie</DialogTitle>
          <DialogDescription>
            Sélectionnez le type d'activité pour créer un nouveau compte compagnie
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-6">
          {ACTIVITY_TYPES.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <button
                key={activity.id}
                onClick={() => handleSelectActivity(activity.id)}
                className={`p-4 rounded-lg border-2 border-transparent transition-all duration-200 ${activity.color} hover:border-primary hover:shadow-md`}
              >
                <div className="flex flex-col items-center gap-3">
                  <IconComponent className={`h-8 w-8 ${activity.textColor}`} />
                  <div className="text-center">
                    <h3 className={`font-semibold ${activity.textColor}`}>{activity.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
