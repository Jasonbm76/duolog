import PlaygroundViewer from "@/components/admin/PlaygroundViewer";

export default function PlaygroundPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Component Playground</h1>
        <p className="text-on-dark-muted text-lg">
          Interactive playground to test and experiment with components
        </p>
      </div>

      <PlaygroundViewer />
    </div>
  );
}