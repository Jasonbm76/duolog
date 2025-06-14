"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface SearchResult {
  slug: string;
  title: string;
  category: string;
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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
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
        <Card className="absolute top-full mt-2 w-full z-50 bg-white shadow-lg border border-gray-200 max-h-96 overflow-auto">
          <CardContent className="p-2">
            {results.map((result) => (
              <button
                key={result.slug}
                onClick={() => handleResultClick(result.slug)}
                className="w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-900">{result.title}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {result.excerpt}
                    </p>
                  </div>
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded ml-2 flex-shrink-0">
                    {result.category}
                  </span>
                </div>
                <span className="text-xs text-primary mt-2 inline-block">
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
          <Card className="bg-white shadow-lg border border-gray-200">
            <CardContent className="p-4 text-center text-gray-600">
              Searching...
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Results */}
      {isOpen && query && !isLoading && results.length === 0 && (
        <div className="absolute top-full mt-2 w-full">
          <Card className="bg-white shadow-lg border border-gray-200">
            <CardContent className="p-4 text-center text-gray-600">
              No results found for "{query}"
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}