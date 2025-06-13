import { getDocumentationFiles } from "@/lib/documentation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import DocSearch from "@/components/admin/DocSearch";
import { ClientDate } from "@/components/ui/client-date";

export default async function DocsPage() {
  const docs = await getDocumentationFiles();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Documentation</h1>
        <p className="text-on-dark text-lg">
          Browse all project documentation from the /docs folder
        </p>
      </div>

      {/* Search Component */}
      <DocSearch />

      {/* Documentation Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {docs.map((doc) => (
          <Link key={doc.slug} href={`/admin/docs/${doc.slug}`}>
            <Card className="glass-card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-2 text-on-dark mb-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{doc.filePath}</span>
                </div>
                <CardTitle className="line-clamp-2">{doc.title}</CardTitle>
                {doc.frontMatter.description && (
                  <CardDescription className="line-clamp-3">
                    {doc.frontMatter.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-on-dark">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Modified <ClientDate date={doc.lastModified} format="date" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {docs.length === 0 && (
        <Card className="glass-card">
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-on-dark" />
            <p className="text-on-dark">
              No documentation files found in /docs directory
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}