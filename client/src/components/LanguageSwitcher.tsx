import { useI18n, LANGUAGES } from "@/lib/i18n";
import type { Language } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  /** "light" = white text (for dark/orange backgrounds), "dark" = dark text (for light backgrounds) */
  variant?: "light" | "dark";
  className?: string;
}

export function LanguageSwitcher({ variant = "light", className = "" }: LanguageSwitcherProps) {
  const { lang, setLang } = useI18n();
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const textClass = variant === "light"
    ? "text-white hover:bg-white/20 border-white/30"
    : "text-gray-700 hover:bg-gray-100 border-gray-200";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-1.5 bg-transparent text-xs font-semibold px-2.5 py-1.5 h-auto rounded-full border ${textClass} ${className}`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{current.flag}</span>
          <span className="hidden sm:inline">{current.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[130px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`flex items-center gap-2 cursor-pointer text-sm ${
              lang === l.code ? "font-bold text-[#E8751A]" : ""
            }`}
          >
            <span className="text-base">{l.flag}</span>
            <span>{l.nativeName}</span>
            {lang === l.code && (
              <span className="ml-auto text-[#E8751A] text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
