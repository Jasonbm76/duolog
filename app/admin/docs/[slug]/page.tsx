import { getDocumentationFile, getDocumentationFiles } from "@/lib/documentation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MarkdownRenderer from "@/components/admin/MarkdownRenderer";
import { ClientDate } from "@/components/ui/client-date";
import { CopyButton } from "@/components/ui/copy-button";

export async function generateStaticParams() {
  const docs = await getDocumentationFiles();
  return docs.map((doc) => ({
    slug: doc.slug,
  }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDocumentationFile(slug);

  if (!doc) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Navigation */}
      <Link href="/admin/docs">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Documentation
        </Button>
      </Link>

      {/* Document Header */}
      <Card className="bg-white shadow-sm border border-border mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">{doc.filePath}</span>
            </div>
            <CopyButton 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground" 
            />
          </div>
          <CardTitle className="text-3xl text-foreground">{doc.title}</CardTitle>
          {doc.frontMatter.description && (
            <p className="text-muted-foreground mt-2">{doc.frontMatter.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Document Content */}
      <Card className="bg-white shadow-sm border border-border">
        <CardContent className="prose max-w-none pt-6">
          <MarkdownRenderer content={doc.content} />
        </CardContent>
      </Card>

      {/* Document Metadata */}
      <Card className="bg-white shadow-sm border border-border mt-6">
        <CardContent className="pt-6">
          <h3 className="text-foreground font-semibold mb-4">Document Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Last Modified</dt>
              <dd className="text-foreground"><ClientDate date={doc.lastModified} format="datetime" /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">File Path</dt>
              <dd className="font-mono text-foreground">{doc.filePath}</dd>
            </div>
            {Object.entries(doc.frontMatter).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-muted-foreground capitalize">{key}</dt>
                <dd className="text-foreground">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}