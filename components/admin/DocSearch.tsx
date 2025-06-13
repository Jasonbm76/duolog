"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface SearchResult {
  slug: string;
  title: string;
  excerpt: string;
  matchType: "title" | "content";
}

export default function DocSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const searchDocs = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/docs/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchDocs, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (slug: string) => {
    router.push(`/admin/docs/${slug}`);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-dark w-4 h-4" />
        <Input
          type="search"
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 glass-card max-h-96 overflow-auto">
          <CardContent className="p-2">
            {results.map((result) => (
              <button
                key={result.slug}
                onClick={() => handleResultClick(result.slug)}
                className="w-full text-left p-3 rounded-md hover:bg-white/10 transition-colors"
              >
                <h4 className="font-semibold text-sm">{result.title}</h4>
                <p className="text-xs text-on-dark mt-1 line-clamp-2">
                  {result.excerpt}
                </p>
                <span className="text-xs text-primary">
                  Match in {result.matchType}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute top-full mt-2 w-full">
          <Card className="glass-card">
            <CardContent className="p-4 text-center text-on-dark">
              Searching...
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Results */}
      {isOpen && query && !isLoading && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full">
          <Card className="glass-card">
            <CardContent className="p-4 text-center text-on-dark">
              No results found for "{query}"
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}