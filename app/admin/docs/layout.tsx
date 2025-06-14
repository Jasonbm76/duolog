import { getDocumentationFiles } from "@/lib/documentation";
import DocumentationNav from "@/components/admin/DocumentationNav";
import Link from "next/link";
import { Home, FileText } from "lucide-react";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = await getDocumentationFiles();

  return (
    <div className="flex gap-8">
      {/* Left Sidebar Navigation */}
      <aside className="w-80 flex-shrink-0">
        <div className="sticky top-24 glass-card p-6 rounded-xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold gradient-text mb-4">Documentation</h2>
            
            {/* Quick Links */}
            <div className="space-y-2 mb-6">
              <Link
                href="/admin/docs"
                className="flex items-center gap-2 px-3 py-2 text-sm text-on-dark hover:text-on-dark-foreground hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                <span>Overview</span>
              </Link>
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <DocumentationNav docs={docs} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}