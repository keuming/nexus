import React, { useState, useEffect } from "react";
import { MapPin, Fuel, ShoppingCart, ArrowRight, Star, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";

interface Supplier {
  id: number;
  businessName: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  distance?: number;
  bottles?: Array<{
    id: number;
    type: string;
    capacity: string;
    priceXOF: string;
    deliveryFeeXOF: string;
    stock: number;
  }>;
}

export default function GasHome() {
  const [, navigate] = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [selectedBottleType, setSelectedBottleType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Simuler la géolocalisation
  useEffect(() => {
    // Abidjan coordinates par défaut
    setUserLocation({ lat: 5.3364, lng: -4.0383 });

    // Charger les fournisseurs
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      // Simuler les fournisseurs avec localisation
      const mockSuppliers: Supplier[] = [
        {
          id: 1,
          businessName: "ZAZA DEPOT",
          phone: "+225 07 12 34 56 78",
          email: "contact@zazadepot.ci",
          address: "123 Rue du Commerce",
          city: "Abidjan",
          distance: 0.5,
          bottles: [
            {
              id: 1,
              type: "B6",
              capacity: "6kg",
              priceXOF: "2300",
              deliveryFeeXOF: "200",
              stock: 100,
            },
            {
              id: 2,
              type: "B12",
              capacity: "12kg",
              priceXOF: "5500",
              deliveryFeeXOF: "300",
              stock: 50,
            },
          ],
        },
      ];

      setSuppliers(mockSuppliers);
      setFilteredSuppliers(mockSuppliers);
    } catch (error) {
      console.error("Erreur lors du chargement des fournisseurs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterByBottleType = (type: string) => {
    setSelectedBottleType(type);
    if (type === "all") {
      setFilteredSuppliers(suppliers);
    } else {
      setFilteredSuppliers(
        suppliers.filter((supplier) => supplier.bottles?.some((b) => b.type === type))
      );
    }
  };

  const handleOrderClick = (supplierId: number) => {
    navigate(`/gas-order?supplier=${supplierId}`);
  };

  const bottleTypes = ["B6", "B12"];
  const allBottles = suppliers
    .flatMap((s) => s.bottles || [])
    .reduce(
      (acc: typeof suppliers[0]["bottles"], bottle) => {
        if (acc && !acc.find((b) => b.type === bottle.type)) {
          acc.push(bottle);
        }
        return acc;
      },
      [] as typeof suppliers[0]["bottles"]
    ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16 md:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -ml-48 -mb-48"></div>
        </div>

        <div className="relative container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Fuel className="w-8 h-8" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider">Gaz à domicile</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Commandez votre gaz en ligne
              </h1>

              <p className="text-lg text-white/90 mb-8 max-w-lg">
                Trouvez les fournisseurs les plus proches de chez vous, comparez les prix et
                commandez en quelques clics. Livraison rapide et sécurisée.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100 font-semibold"
                >
                  Commencer maintenant
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  En savoir plus
                </Button>
              </div>
            </div>

            <div className="flex-1 hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-3xl blur-3xl opacity-30"></div>
                <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-white/90">
                      <MapPin className="w-5 h-5" />
                      <span>Localisation activée</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                      <Fuel className="w-5 h-5" />
                      <span>Fournisseurs à proximité</span>
                    </div>
                    <div className="flex items-center gap-3 text-white/90">
                      <ShoppingCart className="w-5 h-5" />
                      <span>Panier sécurisé</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Info */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span className="text-sm md:text-base">
              {userLocation
                ? `Recherche autour de vous (rayon 1km)`
                : "Activez la localisation pour trouver les fournisseurs proches"}
            </span>
          </div>
        </div>
      </section>

      {/* Bottle Type Filter */}
      <section className="bg-white py-8 border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sélectionnez votre type de bouteille</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => filterByBottleType("all")}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedBottleType === "all"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="font-semibold text-gray-900">Tous les types</div>
              <div className="text-sm text-gray-500">Afficher tous</div>
            </button>

                  {bottleTypes.map((type) => {
                const bottle = (allBottles || []).find((b) => b?.type === type);
              return (
                <button
                  key={type}
                  onClick={() => filterByBottleType(type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedBottleType === type
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900">{type}</div>
                  <div className="text-sm text-gray-500">{bottle?.capacity}</div>
                  <div className="text-lg font-bold text-orange-600 mt-2">
                    {bottle ? `${bottle.priceXOF} XOF` : "-"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Suppliers Gallery */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Fournisseurs disponibles
          </h2>
          <p className="text-gray-600 mb-8">
            {filteredSuppliers.length} fournisseur{filteredSuppliers.length > 1 ? "s" : ""} trouvé
            {filteredSuppliers.length > 1 ? "s" : ""} près de vous
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : filteredSuppliers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSuppliers.map((supplier) => (
                <Card
                  key={supplier.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Supplier Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{supplier.businessName}</h3>
                        <div className="flex items-center gap-1 mt-2 text-orange-100">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">
                            {supplier.distance ? `${supplier.distance}km de vous` : "Près de vous"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/20 p-2 rounded-lg">
                        <Star className="w-5 h-5 fill-white" />
                      </div>
                    </div>
                  </div>

                  {/* Supplier Info */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-orange-500" />
                        <a href={`tel:${supplier.phone}`} className="hover:text-orange-600">
                          {supplier.phone}
                        </a>
                      </div>
                      {supplier.address && (
                        <div className="flex items-start gap-2 text-gray-700 text-sm">
                          <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span>{supplier.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottles Available */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Bouteilles disponibles</h4>
                      <div className="space-y-2">
                        {supplier.bottles
                          ?.filter(
                            (b) =>
                              selectedBottleType === "all" || b.type === selectedBottleType
                          )
                          .map((bottle) => (
                            <div
                              key={bottle.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div>
                                <div className="font-semibold text-gray-900">{bottle.type}</div>
                                <div className="text-xs text-gray-500">{bottle.capacity}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-orange-600">
                                  {bottle.priceXOF} XOF
                                </div>
                                <div className="text-xs text-gray-500">
                                  +{bottle.deliveryFeeXOF} XOF livraison
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => handleOrderClick(supplier.id)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Commander maintenant
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Fuel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Aucun fournisseur trouvé pour ce type de bouteille</p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-12 md:py-16 border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 text-center">
            Pourquoi nous choisir?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: "Fournisseurs proches",
                description: "Trouvez les fournisseurs à moins de 1km de chez vous",
              },
              {
                icon: Clock,
                title: "Livraison rapide",
                description: "Livraison en moins de 2 heures dans la plupart des cas",
              },
              {
                icon: ShoppingCart,
                title: "Panier sécurisé",
                description: "Paiement sécurisé et suivi de commande en temps réel",
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
