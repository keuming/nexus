/**
 * Hook useNotificationSound — Joue un son de notification
 * Utilise l'API Web Audio ou des éléments audio HTML5
 */

import { useCallback } from "react";

export function useNotificationSound() {
  const playSound = useCallback((type: "admin" | "message" | "default" = "default") => {
    try {
      // Créer un contexte audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Paramètres du son selon le type
      const soundParams = {
        admin: { frequency: 800, duration: 0.3, volume: 0.5 },
        message: { frequency: 600, duration: 0.2, volume: 0.3 },
        default: { frequency: 700, duration: 0.25, volume: 0.4 },
      };

      const params = soundParams[type];

      // Créer les nœuds audio
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurer le son
      oscillator.frequency.value = params.frequency;
      oscillator.type = "sine";

      // Envelope ADSR simple
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(params.volume, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + params.duration);

      // Jouer le son
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + params.duration);
    } catch (error) {
      console.warn("[NotificationSound] Impossible de jouer le son:", error);
      // Fallback silencieux si l'API audio n'est pas disponible
    }
  }, []);

  return { playSound };
}
