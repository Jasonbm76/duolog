"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, ChevronRight, ChevronDown, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocFile } from "@/lib/documentation";

interface DocumentationNavProps {
  docs: DocFile[];
}

interface CategoryGroup {
  category: string;
  docs: DocFile[];
}

export default function DocumentationNav({ docs }: DocumentationNavProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group documents by category
  const groupedDocs = docs.reduce((acc, doc) => {
    const existing = acc.find(g => g.category === doc.category);
    if (existing) {
      existing.docs.push(doc);
    } else {
      acc.push({ category: doc.category, docs: [doc] });
    }
    return acc;
  }, [] as CategoryGroup[]);

  // Sort categories and docs within each category
  groupedDocs.sort((a, b) => a.category.localeCompare(b.category));
  groupedDocs.forEach(group => {
    group.docs.sort((a, b) => a.title.localeCompare(b.title));
  });

  // Expand active category on mount
  useEffect(() => {
    const activeDoc = docs.find(doc => pathname === `/admin/docs/${doc.slug}`);
    if (activeDoc) {
      setExpandedCategories(prev => new Set([...prev, activeDoc.category]));
    }
  }, [pathname, docs]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <nav className="w-full">
      <div className="space-y-3">
        {groupedDocs.map(({ category, docs: categoryDocs }) => {
          const isExpanded = expandedCategories.has(category);
          
          return (
            <div key={category} className="space-y-1">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-on-dark hover:text-on-dark-foreground hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <Folder className="w-4 h-4" />
                <span>{category}</span>
                <span className="ml-auto text-xs text-on-dark bg-white/10 px-2 py-0.5 rounded-full">
                  {categoryDocs.length}
                </span>
              </button>
              
              {isExpanded && (
                <div className="ml-6 space-y-0.5">
                  {categoryDocs.map((doc) => {
                    const isActive = pathname === `/admin/docs/${doc.slug}`;
                    
                    return (
                      <Link
                        key={doc.slug}
                        href={`/admin/docs/${doc.slug}`}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-on-dark hover:text-on-dark-foreground hover:bg-white/5"
                        )}
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}