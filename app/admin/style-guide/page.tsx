import { getStyleGuideData } from "@/lib/style-guide";
import StyleGuideViewer from "@/components/admin/StyleGuideViewer";

export default async function StyleGuidePage() {
  const styleData = await getStyleGuideData();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Style Guide</h1>
        <p className="text-on-dark text-lg">
          Auto-generated from Tailwind configuration and custom styles
        </p>
      </div>

      <StyleGuideViewer data={styleData} />
    </div>
  );
}