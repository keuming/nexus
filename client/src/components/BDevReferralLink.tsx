/**
 * BDevReferralLink.tsx — Composant pour afficher et copier le lien de parrainage
 * Permet aux Business Développeurs de partager leur lien unique pour recruter
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Link as LinkIcon, Share2 } from "lucide-react";
import { toast } from "sonner";

interface BDevReferralLinkProps {
  bdevId: string;
  domain?: string;
}

export function BDevReferralLink({ bdevId, domain = "https://nexus.africa" }: BDevReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const referralLink = `${domain}/register?bdev=${bdevId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Lien de parrainage copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const message = encodeURIComponent(
      `Rejoins NEXUS et bénéficie de ma commission ! 🚀\n\n${referralLink}\n\nID Parrain: ${bdevId}`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareOnLinkedIn = () => {
    const message = encodeURIComponent(
      `Rejoins le réseau NEXUS et commence à générer des revenus ! ${referralLink}`
    );
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-orange-400" />
          Votre Lien de Parrainage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300 text-sm">
          Partagez ce lien pour recruter des établissements. Chaque établissement recruté vous rapproche du CDI !
        </p>

        {/* Affichage du lien */}
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-xs mb-1">Votre lien unique :</p>
            <p className="text-orange-400 font-mono text-sm break-all">{referralLink}</p>
          </div>
          <Button
            onClick={copyToClipboard}
            size="sm"
            className={`flex-shrink-0 ${
              copied
                ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copier
              </>
            )}
          </Button>
        </div>

        {/* Boutons de partage */}
        <div className="space-y-2">
          <p className="text-slate-400 text-xs">Partager sur :</p>
          <div className="flex gap-2">
            <Button
              onClick={shareOnWhatsApp}
              variant="outline"
              size="sm"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Share2 className="w-4 h-4 mr-1" />
              WhatsApp
            </Button>
            <Button
              onClick={shareOnLinkedIn}
              variant="outline"
              size="sm"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Share2 className="w-4 h-4 mr-1" />
              LinkedIn
            </Button>
          </div>
        </div>

        {/* Conseil */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-blue-300 text-xs">
            💡 <strong>Conseil :</strong> Partagez ce lien avec vos contacts pour recruter des établissements. 
            Chaque établissement recruté = 1 point vers votre CDI (10 points pour une compagnie de transport).
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
