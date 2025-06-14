import { NextRequest, NextResponse } from "next/server";
import { searchDocumentation } from "@/lib/documentation";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    const docs = await searchDocumentation(query);
    const results = docs.map((doc) => {
      // Find the best excerpt
      const contentLower = doc.content.toLowerCase();
      const queryLower = query.toLowerCase();
      const index = contentLower.indexOf(queryLower);
      
      let excerpt = "";
      let matchType: "title" | "content" = "content";
      
      if (doc.title.toLowerCase().includes(queryLower)) {
        matchType = "title";
        // If match is in title, show beginning of content
        excerpt = doc.content.substring(0, 150).trim() + "...";
      } else if (index !== -1) {
        // If match is in content, show context around match
        const start = Math.max(0, index - 50);
        const end = Math.min(doc.content.length, index + query.length + 100);
        excerpt = (start > 0 ? "..." : "") + 
                  doc.content.substring(start, end).trim() + 
                  (end < doc.content.length ? "..." : "");
      } else {
        // Fallback to beginning of content
        excerpt = doc.content.substring(0, 150).trim() + "...";
      }

      return {
        slug: doc.slug,
        title: doc.title,
        category: doc.category,
        excerpt,
        matchType,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search documentation" }, { status: 500 });
  }
}