import { useState, useRef, useEffect } from "react";
import { Search, X, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

interface SearchResult {
  id: string;
  type: "transport" | "restaurant" | "expedition";
  name: string;
  description: string;
  price?: number;
  cuisine?: string;
  status?: string;
}

export function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const searchQuery = trpc.search.globalSearch.useQuery(
    { query, type: "all" },
    { enabled: query.length > 0 }
  );

  const addFavoriteMutation = trpc.search.addFavorite.useMutation();
  const removeFavoriteMutation = trpc.search.removeFavorite.useMutation();

  useEffect(() => {
    if (searchQuery.data) {
      setResults(searchQuery.data);
      setSelectedIndex(-1);
    }
  }, [searchQuery.data]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    // Navigate based on type
    switch (result.type) {
      case "transport":
        navigate("/transport/search?query=" + result.name);
        break;
      case "restaurant":
        navigate("/restaurant/search?query=" + result.name);
        break;
      case "expedition":
        navigate("/expedition/search?query=" + result.name);
        break;
    }
    setIsOpen(false);
    setQuery("");
  };

  const toggleFavorite = (result: SearchResult) => {
    const key = `${result.type}-${result.id}`;
    if (favorites.has(key)) {
      removeFavoriteMutation.mutate({
        itemId: result.id,
        itemType: result.type,
      });
      setFavorites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    } else {
      addFavoriteMutation.mutate({
        itemId: result.id,
        itemType: result.type,
        itemName: result.name,
        itemDescription: result.description,
      });
      setFavorites((prev) => new Set(prev).add(key));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "transport":
        return "🚌";
      case "restaurant":
        return "🍽️";
      case "expedition":
        return "📦";
      default:
        return "🔍";
    }
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Chercher trajets, restaurants, colis..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(e.target.value.length > 0);
          }}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 py-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-white/40"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {results.map((result, index) => (
              <motion.div
                key={`${result.type}-${result.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 border-b last:border-b-0 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? "bg-orange-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleSelectResult(result)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">{getTypeIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {result.name}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {result.description}
                      </p>
                      {result.price && (
                        <p className="text-sm font-semibold text-orange-600">
                          {result.price.toLocaleString()} FCFA
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(result);
                    }}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favorites.has(`${result.type}-${result.id}`)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && query && results.length === 0 && !searchQuery.isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg p-4 text-center text-gray-600"
        >
          Aucun résultat trouvé
        </motion.div>
      )}
    </div>
  );
}
