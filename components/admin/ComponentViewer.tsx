"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Code2, Eye, Folder } from "lucide-react";
import type { ComponentInfo } from "@/lib/documentation";

interface ComponentViewerProps {
  components: ComponentInfo[];
}

export default function ComponentViewer({ components }: ComponentViewerProps) {
  const [selectedComponent, setSelectedComponent] = useState<ComponentInfo | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Group components by category
  const componentsByCategory = components.reduce((acc, component) => {
    const category = component.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(component);
    return acc;
  }, {} as Record<string, ComponentInfo[]>);

  const categories = Object.keys(componentsByCategory).sort();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Component List */}
      <div className="lg:col-span-1">
        <Card className="glass-card h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Components ({components.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="font-semibold text-sm text-on-dark mb-2 uppercase tracking-wide">
                  {category}
                </h3>
                <div className="space-y-1">
                  {componentsByCategory[category].map((component) => (
                    <button
                      key={component.name}
                      onClick={() => setSelectedComponent(component)}
                      className={`w-full text-left p-2 rounded-md text-sm hover:bg-white/10 transition-colors text-on-dark ${
                        selectedComponent?.name === component.name ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="font-medium">{component.name}</div>
                      {component.description && (
                        <div className="text-xs text-on-dark-muted line-clamp-1">
                          {component.description}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Component Details */}
      <div className="lg:col-span-2">
        {selectedComponent ? (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedComponent.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Code2 className="w-4 h-4" />
                    {selectedComponent.filePath}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{selectedComponent.category}</Badge>
              </div>
              {selectedComponent.description && (
                <p className="text-on-dark mt-2">{selectedComponent.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="props" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="props">Props</TabsTrigger>
                  <TabsTrigger value="usage">Usage</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                </TabsList>

                <TabsContent value="props" className="space-y-4">
                  {selectedComponent.props && selectedComponent.props.length > 0 ? (
                    <div className="space-y-3">
                      {selectedComponent.props.map((prop) => (
                        <Card key={prop.name} className="bg-black/20 border-white/10">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <code className="text-sm font-mono text-on-dark">{prop.name}</code>
                                  {prop.required && (
                                    <Badge variant="error" className="text-xs">Required</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-on-dark mb-1">
                                  Type: <code className="text-xs text-on-dark">{prop.type}</code>
                                </div>
                                {prop.description && (
                                  <p className="text-sm text-on-dark">{prop.description}</p>
                                )}
                                {prop.defaultValue && (
                                  <div className="text-sm text-on-dark mt-1">
                                    Default: <code className="text-xs text-on-dark">{prop.defaultValue}</code>
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(prop.name, `prop-${prop.name}`)}
                              >
                                {copiedItem === `prop-${prop.name}` ? (
                                  <Copy className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-on-dark">
                      <Code2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No props documentation found</p>
                      <p className="text-sm">Props will be auto-detected from TypeScript interfaces</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="usage" className="space-y-4">
                  <div>
                                         <h3 className="font-semibold mb-2">Import Statement</h3>
                    <div className="relative">
                      <pre className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-sm overflow-x-auto">
                        <code className="text-on-dark">{`import { ${selectedComponent.name} } from "@${selectedComponent.filePath.replace('.tsx', '')}";`}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(
                          `import { ${selectedComponent.name} } from "@${selectedComponent.filePath.replace('.tsx', '')}";`,
                          'import'
                        )}
                      >
                        {copiedItem === 'import' ? <Copy className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                                         <h3 className="font-semibold mb-2">Basic Usage</h3>
                    <div className="relative">
                      <pre className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-sm overflow-x-auto">
                        <code className="text-on-dark">{`<${selectedComponent.name}${selectedComponent.props?.some(p => p.required) ? '\n' + selectedComponent.props.filter(p => p.required).map(p => `  ${p.name}={/* ${p.type} */}`).join('\n') + '\n' : ' '}>`}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(
                          `<${selectedComponent.name}${selectedComponent.props?.some(p => p.required) ? '\n' + selectedComponent.props.filter(p => p.required).map(p => `  ${p.name}={/* ${p.type} */}`).join('\n') + '\n' : ' '}>`,
                          'usage'
                        )}
                      >
                        {copiedItem === 'usage' ? <Copy className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="examples" className="space-y-4">
                  <div className="text-center py-8 text-on-dark">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Live examples coming soon</p>
                    <p className="text-sm">This will show interactive component examples</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Code2 className="w-12 h-12 mx-auto mb-4 text-on-dark" />
              <p className="text-on-dark">
                Select a component from the list to view its documentation
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}