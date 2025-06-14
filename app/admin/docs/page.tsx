import { getDocumentationFiles } from "@/lib/documentation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Folder, BookOpen } from "lucide-react";
import DocSearch from "@/components/admin/DocSearch";
import { ClientDate } from "@/components/ui/client-date";

export default async function DocsPage() {
  const docs = await getDocumentationFiles();
  
  // Group documents by category
  const groupedDocs = docs.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof docs>);

  // Sort categories
  const sortedCategories = Object.keys(groupedDocs).sort();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Documentation Overview</h1>
        <p className="text-on-dark text-lg">
          Browse all project documentation organized by category
        </p>
      </div>

      {/* Search Component */}
      <DocSearch />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{docs.length}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/20 rounded-lg">
                <Folder className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{sortedCategories.length}</p>
                <p className="text-sm text-gray-600">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-info/20 rounded-lg">
                <BookOpen className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {docs.length > 0 ? new Date(Math.max(...docs.map(d => d.lastModified.getTime()))).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Last Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation by Category */}
      <div className="space-y-8">
        {sortedCategories.map((category) => (
          <div key={category}>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-on-dark">
              <Folder className="w-5 h-5 text-on-dark-muted" />
              {category}
            </h2>
            
            <div className="space-y-2">
              {groupedDocs[category].map((doc) => (
                <Link key={doc.slug} href={`/admin/docs/${doc.slug}`}>
                  <Card className="bg-white shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:border-primary/50 border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate text-gray-900">{doc.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="truncate">{doc.relativePath}</span>
                              <span className="shrink-0">•</span>
                              <span className="shrink-0">
                                <ClientDate date={doc.lastModified} format="relative" />
                              </span>
                            </div>
                          </div>
                        </div>
                        {doc.frontMatter.description && (
                          <div className="hidden md:block max-w-xs ml-4">
                            <p className="text-sm text-gray-600 truncate">
                              {doc.frontMatter.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {docs.length === 0 && (
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-600">
              No documentation files found in /docs directory
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}