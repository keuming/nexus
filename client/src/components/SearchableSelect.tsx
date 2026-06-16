import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  disabled = false,
  searchPlaceholder = "Rechercher...",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrer les options en fonction du terme de recherche
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().startsWith(searchTerm.toLowerCase())
  );

  // Obtenir le label de la valeur sélectionnée
  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus sur l'input quand le dropdown s'ouvre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Bouton principal */}
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full justify-between",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {selectedLabel}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <X className="h-4 w-4 hover:text-destructive" onClick={handleClear} />
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 border border-input rounded-md bg-background shadow-md">
          {/* Champ de recherche */}
          <div className="p-2 border-b border-input">
            <Input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>

          {/* Liste des options */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors",
                    value === option.value && "bg-accent text-accent-foreground font-semibold"
                  )}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                Aucun résultat
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
