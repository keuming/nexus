/**
 * AdCarousel.tsx — Carrousel publicitaire dynamique avec défilement automatique
 */
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediconnectAdBanner } from "./MediconnectAdBanner";
import { HealthcareManagementBanner } from "./HealthcareManagementBanner";

interface AdSlide {
  id: string;
  component: React.ReactNode;
  title: string;
}

interface AdCarouselProps {
  autoplayInterval?: number; // en millisecondes (défaut: 5000)
  showControls?: boolean;
}

export function AdCarousel({ autoplayInterval = 5000, showControls = true }: AdCarouselProps) {
  const slides: AdSlide[] = [
    {
      id: "mediconnect-rdv",
      component: <MediconnectAdBanner position="left" />,
      title: "Mediconnect4Africa - Rendez-vous",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  // Autoplay logic
  useEffect(() => {
    if (!isAutoplay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [isAutoplay, autoplayInterval, slides.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoplay(false);
    // Reprendre l'autoplay après 10 secondes d'inactivité
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setIsAutoplay(false);
    // Reprendre l'autoplay après 10 secondes d'inactivité
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoplay(false);
    // Reprendre l'autoplay après 10 secondes d'inactivité
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsAutoplay(false)}
      onMouseLeave={() => setIsAutoplay(true)}
    >
      {/* Carrousel principal */}
      <div className="relative overflow-hidden rounded-lg">
        {/* Slides */}
        <div className="relative h-96">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="h-full flex items-center justify-center p-4">
                {slide.component}
              </div>
            </div>
          ))}
        </div>

        {/* Contrôles de navigation */}
        {showControls && (
          <>
            {/* Bouton précédent */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-200"
              aria-label="Annonce précédente"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Bouton suivant */}
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/75 text-white p-2 rounded-full transition-all duration-200"
              aria-label="Annonce suivante"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Indicateurs de pagination */}
      <div className="flex justify-center gap-2 mt-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? "bg-orange-500 w-8"
                : "bg-gray-300 hover:bg-gray-400 w-2"
            }`}
            aria-label={`Aller à l'annonce ${index + 1}`}
          />
        ))}
      </div>


    </div>
  );
}
