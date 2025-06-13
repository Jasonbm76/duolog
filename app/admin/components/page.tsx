import { getComponentFiles } from "@/lib/documentation";
import ComponentViewer from "@/components/admin/ComponentViewer";

export default async function ComponentsPage() {
  const components = await getComponentFiles();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Component Library</h1>
        <p className="text-on-dark text-lg">
          Auto-generated documentation for all project components
        </p>
      </div>

      <ComponentViewer components={components} />
    </div>
  );
}