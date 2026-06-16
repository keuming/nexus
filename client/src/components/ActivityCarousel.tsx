/**
 * Activity Carousel Component
 * Identical to the Recruitment carousel but for Transport/Restaurant/Expedition
 * With animations, dynamic partners, and contextual CTAs
 */

import { Bus, UtensilsCrossed, Package, ChevronRight, Hotel, ShoppingBag, Building2, Home, Gamepad2, Warehouse, Fuel } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface ActivityCarouselProps {
  onActivitySelect?: (activity: "transport" | "restauration" | "expedition" | "hotel" | "boutique" | "residence_meuble" | "loisirs" | "location_vente") => void;
}

export function ActivityCarousel({ onActivitySelect }: ActivityCarouselProps) {
  const { t } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);
  const [, navigate] = useLocation();

  // Fetch dynamic partners from database
  const { data: companies } = trpc.transport.public.listCompanies.useQuery(undefined);
  
  // Fetch real-time statistics
  const { data: statistics } = trpc.carousel.getStatistics.useQuery(undefined, {
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const activities = [
    {
      id: "transport",
      label: t("activity", "transport"),
      icon: <Bus className="h-5 w-5" />,
      badge: "🚌",
      title: "TRANSPORT",
      description: "Voyagez à travers l'Afrique de l'Ouest",
      stats: [
        { icon: "🌍", label: `${statistics?.activeTrips || 12}+ trajets`, sub: "actifs" },
        { icon: "🚌", label: "100+ bus", sub: "disponibles" },
        { icon: "💰", label: "Tarifs", sub: "compétitifs" },
        { icon: "⭐", label: "5★", sub: "notation" },
      ],
      cta: "Créer un compte compagnie",
      ctaId: "transport-register",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
    {
      id: "restauration",
      label: t("activity", "restaurant"),
      icon: <UtensilsCrossed className="h-5 w-5" />,
      badge: "🍽️",
      title: "RESTAURATION",
      description: "Commandez vos repas en ligne",
      stats: [
        { icon: "🍽️", label: `${statistics?.openRestaurants || 8}+ resto`, sub: "ouverts" },
        { icon: "📦", label: "Livraison", sub: "rapide" },
        { icon: "💳", label: "Paiement", sub: "sécurisé" },
        { icon: "⭐", label: "4.8★", sub: "clients" },
      ],
      cta: "Créer un compte compagnie",
      ctaId: "restaurant-register",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
    {
      id: "expedition",
      label: t("activity", "expedition"),
      icon: <Package className="h-5 w-5" />,
      badge: "📦",
      title: "EXPÉDITION",
      description: "Envoyez vos colis en toute sécurité",
      stats: [
        { icon: "📦", label: `${statistics?.inTransitShipments || 5}+ colis`, sub: "en transit" },
        { icon: "🚚", label: "Suivi", sub: "en temps réel" },
        { icon: "🛡️", label: "Assurance", sub: "incluse" },
        { icon: "⭐", label: "4.9★", sub: "fiabilité" },
      ],
      cta: "Créer un compte compagnie",
      ctaId: "expedition-register",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
    {
      id: "hotel",
      label: "Hôtel",
      icon: <Hotel className="h-5 w-5" />,
      badge: "🏨",
      title: "HÔTELLERIE",
      description: "Réservez votre hébergement en Afrique",
      stats: [
        { icon: "🏨", label: "50+ hôtels", sub: "partenaires" },
        { icon: "🛏️", label: "Chambres", sub: "disponibles" },
        { icon: "💳", label: "Réservation", sub: "en ligne" },
        { icon: "⭐", label: "4.7★", sub: "clients" },
      ],
      cta: "Créer un compte compagnie",
      ctaId: "hotel-register",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
    {
      id: "boutique",
      label: "Boutique",
      icon: <ShoppingBag className="h-5 w-5" />,
      badge: "🛍️",
      title: "BOUTIQUES",
      description: "Découvrez les boutiques et commerces",
      stats: [
        { icon: "🛍️", label: "30+ boutiques", sub: "partenaires" },
        { icon: "📦", label: "Livraison", sub: "disponible" },
        { icon: "💰", label: "Bons plans", sub: "exclusifs" },
        { icon: "⭐", label: "4.6★", sub: "clients" },
      ],
      cta: "Créer un compte compagnie",
      ctaId: "boutique-register",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
    {
      id: "residence_meuble",
      label: t("activity", "residenceMeuble"),
      icon: <Home className="h-5 w-5" />,
      badge: "🏠",
      title: "RÉSIDENCE MEUBLÉE",
      description: "Trouvez votre logement meublé en Afrique",
      stats: [
        { icon: "🏠", label: "100+ résidences", sub: "disponibles" },
        { icon: "🛏️", label: "Réservation", sub: "flexible" },
        { icon: "💳", label: "Paiement", sub: "sécurisé" },
        { icon: "⭐", label: "4.8★", sub: "clients" },
      ],
      cta: "Créer un compte compagnie",
      ctaId: "residence-register",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
    {
      id: "loisirs",
      label: t("activity", "loisirs"),
      icon: <Gamepad2 className="h-5 w-5" />,
      badge: "🎮",
      title: "LOISIRS",
      description: "Réservez vos activités de loisirs en Afrique",
      stats: [
        { icon: "🎮", label: "50+ activités", sub: "disponibles" },
        { icon: "🎫", label: "Réservation", sub: "en ligne" },
        { icon: "💳", label: "Paiement", sub: "sécurisé" },
        { icon: "⭐", label: "4.7★", sub: "clients" },
      ],
      cta: "Créer un compte compagnie",
      ctaId: "loisirs-register",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
    {
      id: "location_vente",
      label: t("activity", "locationVente"),
      icon: <Warehouse className="h-5 w-5" />,
      badge: "🏪",
      title: "LOCATION & VENTE",
      description: "Gérez vos locations et ventes en ligne",
      stats: [
        { icon: "🏪", label: "100+ produits", sub: "disponibles" },
        { icon: "📦", label: "Livraison", sub: "rapide" },
        { icon: "💳", label: "Paiement", sub: "sécurisé" },
        { icon: "⭐", label: "4.8★", sub: "clients" },
      ],
      cta: "Créer un compte compagnie",
      ctaId: "location-vente-register",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
    {
      id: "gaz",
      label: "Commande de Gaz",
      icon: <Fuel className="h-5 w-5" />,
      badge: "🛢️",
      title: "COMMANDE DE GAZ",
      description: "Commandez vos bouteilles de gaz en ligne",
      stats: [
        { icon: "🛢️", label: "B6 & B12", sub: "disponibles" },
        { icon: "🚚", label: "Livraison", sub: "rapide" },
        { icon: "💰", label: "Tarifs", sub: "compétitifs" },
        { icon: "⭐", label: "4.9★", sub: "clients" },
      ],
      cta: "Commander du gaz",
      ctaId: "gaz-order",
      backgroundImage: undefined,
      promo: undefined,
      promoCode: undefined,
      reviews: [],
    },
  ];

  // Get dynamic partners (top 3 companies)
  const getDynamicPartners = (activityId: string) => {
    // Fallback to static data
    const staticPartners: Record<string, any[]> = {
        transport: [
          { icon: "🚌", name: "MATS", country: "Côte d'Ivoire", status: "Premium", color: "bg-orange-500" },
          { icon: "🚌", name: "Gbagba", country: "Ghana", status: "Partenaire", color: "bg-blue-500" },
          { icon: "🚌", name: "Tro-Tro", country: "Togo", status: "Actif", color: "bg-green-500" },
        ],
        restauration: [
          { icon: "🍽️", name: "Chez Mama", country: "Sénégal", status: "Top", color: "bg-orange-500" },
          { icon: "🍽️", name: "Le Grill", country: "Côte d'Ivoire", status: "Populaire", color: "bg-blue-500" },
          { icon: "🍽️", name: "Saveurs", country: "Mali", status: "Nouveau", color: "bg-green-500" },
        ],
        expedition: [
          { icon: "📦", name: "Express Plus", country: "Burkina Faso", status: "Rapide", color: "bg-orange-500" },
          { icon: "📦", name: "Logis", country: "Bénin", status: "Fiable", color: "bg-blue-500" },
          { icon: "📦", name: "Colis Afrique", country: "Niger", status: "Économique", color: "bg-green-500" },
        ],
        hotel: [
          { icon: "🏨", name: "Hôtel Ivoire", country: "Côte d'Ivoire", status: "Premium", color: "bg-purple-500" },
          { icon: "🏨", name: "Grand Bassam", country: "Côte d'Ivoire", status: "Populaire", color: "bg-purple-400" },
          { icon: "🏨", name: "Azalaï", country: "Mali", status: "Partenaire", color: "bg-indigo-500" },
        ],
        boutique: [
          { icon: "🛍️", name: "Mode Abidjan", country: "Côte d'Ivoire", status: "Tendance", color: "bg-pink-500" },
          { icon: "🛍️", name: "Artisanat Dakar", country: "Sénégal", status: "Artisanal", color: "bg-pink-400" },
          { icon: "🛍️", name: "Bazaar Lomé", country: "Togo", status: "Populaire", color: "bg-rose-500" },
        ],
        residence_meuble: [
          { icon: "🏠", name: "Résidence Confort", country: "Côte d'Ivoire", status: "Premium", color: "bg-amber-500" },
          { icon: "🏠", name: "Maison Accueil", country: "Sénégal", status: "Populaire", color: "bg-amber-400" },
          { icon: "🏠", name: "Logis Moderne", country: "Mali", status: "Nouveau", color: "bg-yellow-500" },
        ],
      };
    
    // Use static data (companies API not available yet)
    return staticPartners[activityId] || [];
  };

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (!autoScroll) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % activities.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoScroll]);

  const handleCTA = () => {
    navigate("/register-company");
  };

  const currentActivity = activities[activeIndex];
  const partners = getDynamicPartners(currentActivity.id) || [];

  return (
    <div className="space-y-8">
      {/* Carousel Container */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.section
            key={activeIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="py-14 overflow-hidden relative rounded-2xl"
            style={{
              backgroundImage: currentActivity.backgroundImage ? `url('${currentActivity.backgroundImage}')` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e]/95 via-[#16213e]/90 to-[#0f3460]/85" />
            
            {/* Motif décoratif */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-[#E8751A] blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#E8751A] blur-3xl translate-x-1/3 translate-y-1/3" />
            </div>

            <div className="relative max-w-6xl mx-auto px-4">
              <div className="flex flex-col lg:flex-row items-center gap-10">
                {/* Texte */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex-1 text-center lg:text-left"
                >
                  <div className="inline-flex items-center gap-2 bg-[#E8751A]/20 text-[#E8751A] rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                    <span className="text-lg">{currentActivity.badge}</span>
                    {currentActivity.label}
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-4 leading-tight">
                    {currentActivity.title}
                    <span className="text-[#E8751A] block mt-2">NEXUS</span>
                  </h2>
                  <p className="text-gray-300 text-lg mb-6 max-w-xl">
                    {currentActivity.description}
                  </p>
                  {currentActivity.promo && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-[#E8751A]/30 border border-[#E8751A] rounded-lg px-4 py-2 mb-6 inline-block"
                    >
                      <p className="text-white font-semibold text-sm">{currentActivity.promo}</p>
                      <p className="text-[#E8751A] text-xs font-mono">Code: {currentActivity.promoCode}</p>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {currentActivity.stats.map((stat) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.3 }}
                        className="bg-white/10 backdrop-blur rounded-xl p-3 text-center hover:bg-white/20 transition-colors"
                      >
                        <div className="text-2xl mb-1">{stat.icon}</div>
                        <p className="text-white font-bold text-sm">{stat.label}</p>
                        <p className="text-gray-400 text-xs">{stat.sub}</p>
                      </motion.div>
                    ))}
                  </div>
                  {currentActivity.reviews && currentActivity.reviews.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="mt-6 space-y-2 mb-8"
                    >
                      <p className="text-white font-semibold text-sm mb-3">Avis clients</p>
                      {currentActivity.reviews.map((review: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                          className="bg-white/10 backdrop-blur rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-semibold text-sm">{review.author}</p>
                            <span className="text-yellow-400 text-sm">{'⭐'.repeat(review.rating)}</span>
                          </div>
                          <p className="text-gray-300 text-xs">{review.text}</p>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCTA()}
                    className="inline-flex items-center gap-2 bg-[#E8751A] hover:bg-[#D06015] text-white font-bold px-8 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-orange-900/30"
                  >
                    <Building2 className="h-5 w-5" />
                    {currentActivity.cta}
                    <ChevronRight className="h-5 w-5" />
                  </motion.button>
                </motion.div>

                {/* Illustration */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="hidden lg:flex flex-col gap-3 w-72"
                >
                  {(partners || []).map((partner: any, idx: number) => (
                    <motion.div
                      key={partner.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1, duration: 0.3 }}
                      className="bg-white/10 backdrop-blur rounded-xl p-4 flex items-center gap-3 border border-white/10 hover:border-[#E8751A]/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#E8751A]/30 flex items-center justify-center text-white font-bold text-sm">
                        {partner.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">{partner.name}</p>
                        <p className="text-gray-400 text-xs">{partner.country}</p>
                      </div>
                      <span className={`text-xs text-white px-2 py-0.5 rounded-full ${partner.color}`}>
                        {partner.status}
                      </span>
                    </motion.div>
                  ))}
                  <p className="text-center text-gray-500 text-xs mt-1">
                    {t("carousel", "partners") || "Partenaires actifs"}
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {activities.map((_, idx) => (
            <motion.button
              key={idx}
              onClick={() => {
                setActiveIndex(idx);
                setAutoScroll(false);
                setTimeout(() => setAutoScroll(true), 10000);
              }}
              className={`h-2 rounded-full transition-all ${
                idx === activeIndex ? "bg-[#E8751A] w-8" : "bg-gray-400 w-2 hover:bg-gray-500"
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        {/* Navigation Arrows */}
        <motion.button
          onClick={() => {
            setActiveIndex((prev) => (prev - 1 + activities.length) % activities.length);
            setAutoScroll(false);
            setTimeout(() => setAutoScroll(true), 10000);
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 bg-[#E8751A] hover:bg-[#D06015] text-white p-3 rounded-full shadow-lg transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          ←
        </motion.button>
        <motion.button
          onClick={() => {
            setActiveIndex((prev) => (prev + 1) % activities.length);
            setAutoScroll(false);
            setTimeout(() => setAutoScroll(true), 10000);
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 bg-[#E8751A] hover:bg-[#D06015] text-white p-3 rounded-full shadow-lg transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          →
        </motion.button>
      </div>

    </div>
  );
}
