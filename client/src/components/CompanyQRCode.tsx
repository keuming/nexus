import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, QrCode, ExternalLink } from "lucide-react";
import { useState } from "react";

interface CompanyQRCodeProps {
  companyId: number;
  companyName: string;
  activityType: "transport" | "restauration" | "expedition" | "hotel" | "boutique";
}

export function CompanyQRCode({ companyId, companyName, activityType }: CompanyQRCodeProps) {
  const [copied, setCopied] = useState(false);

  // Build the direct link to the company's page on the public interface
  const origin = window.location.origin;
  const directLink = `${origin}/?company=${companyId}&activity=${activityType}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(directLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = directLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const activityLabels: Record<string, string> = {
    transport: "Transport",
    restauration: "Restauration",
    expedition: "Expédition",
    hotel: "Hôtellerie",
    boutique: "Boutique",
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="h-5 w-5 text-[#E8751A]" />
          QR Code & Lien direct
        </CardTitle>
        <p className="text-xs text-gray-500">
          Partagez ce QR code ou ce lien avec vos clients pour qu'ils accèdent directement à vos offres {activityLabels[activityType]}.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* QR Code */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-100">
            <QRCodeSVG
              value={directLink}
              size={180}
              bgColor="#ffffff"
              fgColor="#1a1a1a"
              level="H"
              includeMargin={false}
            />
          </div>
          <p className="text-xs text-gray-400 text-center">
            Scannez pour accéder directement aux offres de <strong>{companyName}</strong>
          </p>
        </div>

        {/* Direct link */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Lien direct</p>
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg border border-gray-200 p-2.5">
            <p className="text-xs text-gray-600 flex-1 truncate font-mono">{directLink}</p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-7 px-2 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-500 mr-1" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copier
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Open link */}
        <a
          href={directLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-[#E8751A] hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir la page client
        </a>
      </CardContent>
    </Card>
  );
}
