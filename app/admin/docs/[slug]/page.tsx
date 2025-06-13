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
      <Card className="glass-card mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-on-dark mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm">{doc.filePath}</span>
            </div>
            <CopyButton 
              variant="ghost" 
              size="sm" 
              className="text-on-dark hover:text-foreground" 
            />
          </div>
          <CardTitle className="text-3xl">{doc.title}</CardTitle>
          {doc.frontMatter.description && (
            <p className="text-on-dark mt-2">{doc.frontMatter.description}</p>
          )}
        </CardHeader>
      </Card>

      {/* Document Content */}
      <Card className="glass-card">
        <CardContent className="prose prose-invert max-w-none pt-6">
          <MarkdownRenderer content={doc.content} />
        </CardContent>
      </Card>

      {/* Document Metadata */}
      <Card className="glass-card mt-6">
        <CardContent className="pt-6">
          <h3 className="text-on-dark">Document Information</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-on-dark">Last Modified</dt>
              <dd><ClientDate date={doc.lastModified} format="datetime" /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-on-dark">File Path</dt>
              <dd className="font-mono">{doc.filePath}</dd>
            </div>
            {Object.entries(doc.frontMatter).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <dt className="text-on-dark capitalize">{key}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}