/**
 * ActivityCarousel — Section "Découvrez nos partenaires"
 * Design moderne : grille de cartes premium dark
 */

import { Bus, UtensilsCrossed, Package, Hotel, ShoppingBag, Home, Gamepad2, Warehouse, Fuel, Plane, ArrowRight, Users, Star, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type ActivityId = "transport" | "restauration" | "expedition" | "hotel" | "boutique" | "residence_meuble" | "loisirs" | "location_vente" | "gaz" | "agence_voyage";

interface ActivityCarouselProps {
  onActivitySelect?: (activity: ActivityId) => void;
}

const ACTIVITY_CONFIG: {
  id: ActivityId;
  emoji: string;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  stat: string;
  statLabel: string;
}[] = [
  {
    id: "transport",
    emoji: "🚌",
    label: "Transport",
    description: "Billets de bus inter-villes dans toute l'Afrique de l'Ouest",
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.2)",
    stat: "12+",
    statLabel: "trajets actifs",
  },
  {
    id: "restauration",
    emoji: "🍽️",
    label: "Restauration",
    description: "Commandez vos repas en ligne et faites-vous livrer",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.2)",
    stat: "8+",
    statLabel: "restaurants",
  },
  {
    id: "expedition",
    emoji: "📦",
    label: "Expédition",
    description: "Envoyez vos colis partout avec suivi en temps réel",
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.1)",
    border: "rgba(59,130,246,0.2)",
    stat: "5+",
    statLabel: "colis en transit",
  },
  {
    id: "hotel",
    emoji: "🏨",
    label: "Hôtellerie",
    description: "Réservez votre hébergement parmi les meilleurs hôtels",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.2)",
    stat: "50+",
    statLabel: "hôtels partenaires",
  },
  {
    id: "boutique",
    emoji: "🛍️",
    label: "Boutique",
    description: "Commerce & shopping — boutiques et commerces partenaires",
    color: "#ec4899",
    bg: "rgba(236,72,153,0.1)",
    border: "rgba(236,72,153,0.2)",
    stat: "30+",
    statLabel: "boutiques",
  },
  {
    id: "agence_voyage",
    emoji: "✈️",
    label: "Agence Voyage",
    description: "Billets d'avion et forfaits voyage vers toutes destinations",
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.1)",
    border: "rgba(14,165,233,0.2)",
    stat: "15+",
    statLabel: "agences",
  },
  {
    id: "residence_meuble",
    emoji: "🏠",
    label: "Résidence Meublée",
    description: "Logements meublés pour courts et longs séjours",
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.18)",
    stat: "100+",
    statLabel: "résidences",
  },
  {
    id: "loisirs",
    emoji: "🎯",
    label: "Loisirs",
    description: "Activités sportives, culturelles et de divertissement",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.2)",
    stat: "50+",
    statLabel: "activités",
  },
  {
    id: "location_vente",
    emoji: "🔑",
    label: "Location & Vente",
    description: "Location de véhicules, équipements et vente en ligne",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.2)",
    stat: "100+",
    statLabel: "produits",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function ActivityCarousel({ onActivitySelect }: ActivityCarouselProps) {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [hoveredId, setHoveredId] = useState<ActivityId | null>(null);

  const { data: statistics } = trpc.carousel.getStatistics.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: companies } = trpc.transport.public.listCompanies.useQuery(undefined);

  // Compter les compagnies réelles par type
  const countByType = (type: string) =>
    (companies || []).filter((c: any) => c.activityType === type && c.status === "active").length;

  const handleCardClick = (id: ActivityId) => {
    if (onActivitySelect) onActivitySelect(id);
    document.getElementById("services-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section style={{ padding: "0 0 8px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 16px", borderRadius: 99,
          background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)",
          marginBottom: 16,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 8px #f97316" }} />
          <span style={{ color: "#f97316", fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Nos partenaires
          </span>
        </div>
        <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 800, letterSpacing: -0.8, marginBottom: 12 }}>
          Découvrez nos partenaires
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
          Explorez les meilleures compagnies par catégorie de service
        </p>
      </div>

      {/* Grid de cartes */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {ACTIVITY_CONFIG.map((act) => {
          const realCount = countByType(act.id);
          const displayCount = realCount > 0 ? `${realCount}` : act.stat;
          const isHovered = hoveredId === act.id;

          return (
            <motion.div
              key={act.id}
              variants={cardVariants}
              onClick={() => handleCardClick(act.id)}
              onMouseEnter={() => setHoveredId(act.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: isHovered ? act.bg : "rgba(255,255,255,0.025)",
                border: `1px solid ${isHovered ? act.border : "rgba(255,255,255,0.07)"}`,
                borderRadius: 20,
                padding: "24px 22px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                boxShadow: isHovered ? `0 16px 48px ${act.color}20` : "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow décoratif */}
              {isHovered && (
                <div style={{
                  position: "absolute", top: -20, right: -20,
                  width: 120, height: 120, borderRadius: "50%",
                  background: `radial-gradient(circle, ${act.color}25 0%, transparent 70%)`,
                  pointerEvents: "none",
                }} />
              )}

              {/* Emoji en fond */}
              <div style={{
                position: "absolute", bottom: -8, right: 8,
                fontSize: 64, opacity: isHovered ? 0.12 : 0.05,
                lineHeight: 1, transition: "opacity 0.25s",
                pointerEvents: "none",
              }}>{act.emoji}</div>

              {/* Header carte */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                {/* Icône + label */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: isHovered ? `${act.color}22` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isHovered ? act.color + "40" : "rgba(255,255,255,0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, transition: "all 0.25s",
                  }}>
                    {act.emoji}
                  </div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{act.label}</div>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4,
                      padding: "2px 8px", borderRadius: 99,
                      background: isHovered ? `${act.color}20` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isHovered ? act.color + "30" : "rgba(255,255,255,0.06)"}`,
                    }}>
                      <span style={{ color: isHovered ? act.color : "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600 }}>
                        {displayCount} {act.statLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flèche */}
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: isHovered ? act.color : "rgba(255,255,255,0.04)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.25s", flexShrink: 0,
                }}>
                  <ArrowRight size={14} style={{ color: isHovered ? "#fff" : "rgba(255,255,255,0.25)", transition: "color 0.25s" }} />
                </div>
              </div>

              {/* Description */}
              <p style={{
                color: isHovered ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                fontSize: 13, lineHeight: 1.6, margin: 0,
                transition: "color 0.25s",
              }}>
                {act.description}
              </p>

              {/* Barre de couleur en bas */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: 2,
                background: isHovered
                  ? `linear-gradient(90deg, ${act.color}, transparent)`
                  : "transparent",
                borderRadius: "0 0 20px 20px",
                transition: "background 0.3s",
              }} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA bas de section */}
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <button
          onClick={() => navigate("/register-company")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "12px 28px", borderRadius: 12,
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            color: "#fff", fontSize: 14, fontWeight: 700,
            border: "none", cursor: "pointer",
            boxShadow: "0 8px 30px rgba(249,115,22,0.35)",
          }}
        >
          <Users size={16} />
          Inscrire mon entreprise
          <ArrowRight size={15} />
        </button>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 10 }}>
          Rejoignez +500 compagnies partenaires NEXUS
        </p>
      </div>
    </section>
  );
}
