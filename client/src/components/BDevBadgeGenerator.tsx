/**
 * BDevBadgeGenerator.tsx — Générateur de badge personnalisé pour Business Développeur
 * Génère un badge avec l'ID BDev unique
 */
import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface BDevBadgeGeneratorProps {
  bdevId: string;
  bdevName?: string;
  bdevPhone?: string;
}

export function BDevBadgeGenerator({ bdevId, bdevName, bdevPhone }: BDevBadgeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions du badge
    const width = 800;
    const height = 400;
    canvas.width = width;
    canvas.height = height;

    // Dégradé orange (côté gauche)
    const orangeGradient = ctx.createLinearGradient(0, 0, width / 2, 0);
    orangeGradient.addColorStop(0, "#E8751A");
    orangeGradient.addColorStop(1, "#D4651A");

    // Remplir côté gauche (orange)
    ctx.fillStyle = orangeGradient;
    ctx.fillRect(0, 0, width / 2, height);

    // Remplir côté droit (noir)
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(width / 2, 0, width / 2, height);

    // Ligne de séparation diagonale orange
    ctx.strokeStyle = "#E8751A";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 30, 0);
    ctx.lineTo(width / 2 + 30, height);
    ctx.stroke();

    // Badge circulaire "BD" (côté gauche)
    const circleX = 100;
    const circleY = 80;
    const circleRadius = 40;

    // Cercle blanc
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.fill();

    // Cercle orange (bordure)
    ctx.strokeStyle = "#E8751A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Texte "BD" dans le cercle
    ctx.fillStyle = "#E8751A";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BD", circleX, circleY);

    // Texte "HUB_RESA" (côté gauche, blanc)
    ctx.fillStyle = "white";
    ctx.font = "bold 72px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("HUB_RESA", 180, 140);

    // Texte "BUSINESS DEVELOPER" (côté gauche, blanc)
    ctx.fillStyle = "white";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("BUSINESS DEVELOPER", 180, 220);

    // ID BDev sur le badge (côté droit, blanc)
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`ID: ${bdevId}`, width / 2 + width / 4, 30);

    // Nom du Business Developer (côté droit, blanc, gros)
    ctx.fillStyle = "white";
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bdevName || "[BD NAME]", width / 2 + width / 4, height / 2 - 20);

    // Numéro de téléphone (côté droit, blanc)
    ctx.fillStyle = "white";
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bdevPhone || "[+XXX XX XX XX XX]", width / 2 + width / 4, height / 2 + 30);

    // Texte "Join our network" (bas droit, gris clair)
    ctx.fillStyle = "#999999";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("Join our network", width / 2 + width / 4, height - 20);
  }, [bdevId, bdevName, bdevPhone]);

  const downloadBadge = () => {
    if (!canvasRef.current) return;

    setIsGenerating(true);
    try {
      const link = document.createElement("a");
      link.href = canvasRef.current.toDataURL("image/png");
      link.download = `HUB_RESA_Badge_${bdevId}_${bdevName?.replace(/\s+/g, "_") || "BD"}.png`;
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-700/30 rounded-lg p-4">
        <p className="text-slate-300 text-sm mb-3">
          Votre badge personnalisé avec votre ID BDev. Partagez-le sur LinkedIn, WhatsApp, Twitter !
        </p>
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg border border-slate-600 bg-slate-900"
          style={{ maxHeight: "300px" }}
        />
      </div>
      <Button
        onClick={downloadBadge}
        disabled={isGenerating}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
      >
        <Download className="w-4 h-4 mr-2" />
        {isGenerating ? "Génération..." : "⬇️ Télécharger mon Badge Personnalisé (PNG)"}
      </Button>
    </div>
  );
}
