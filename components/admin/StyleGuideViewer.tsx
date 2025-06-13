"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { StyleGuideData } from "@/lib/style-guide";

interface StyleGuideViewerProps {
  data: StyleGuideData;
}

export default function StyleGuideViewer({ data }: StyleGuideViewerProps) {
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

  return (
    <Tabs defaultValue="colors" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="spacing">Spacing</TabsTrigger>
        <TabsTrigger value="glassmorphism">Glassmorphism</TabsTrigger>
        <TabsTrigger value="animations">Animations</TabsTrigger>
      </TabsList>

      {/* Colors Tab */}
      <TabsContent value="colors" className="space-y-8">
        {/* Semantic Colors */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-on-dark">Semantic Colors</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.colors.semantic.map((color) => (
              <Card key={color.name} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">{color.name}</CardTitle>
                  {color.cssVariable && (
                    <CardDescription>var({color.cssVariable})</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {color.variants ? (
                    <div className="space-y-2">
                      {Object.entries(color.variants).map(([shade, value]) => (
                        <div
                          key={shade}
                          className="flex items-center justify-between p-2 rounded"
                          style={{ backgroundColor: value }}
                        >
                          <span className="text-xs font-mono" style={{ color: parseInt(shade) >= 500 ? 'white' : 'black' }}>
                            {shade}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => copyToClipboard(value, `${color.name}-${shade}`)}
                          >
                            {copiedItem === `${color.name}-${shade}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div
                        className="h-20 rounded flex items-center justify-center"
                        style={{ backgroundColor: color.value }}
                      >
                        <span className="text-white font-mono text-sm bg-black/30 px-2 py-1 rounded">
                          {color.value}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <code className="text-xs text-on-dark">text-{color.name.toLowerCase().replace(' ', '-')}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(`text-${color.name.toLowerCase().replace(' ', '-')}`, color.name)}
                        >
                          {copiedItem === color.name ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Brand Colors */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-on-dark">Brand Colors</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.colors.brand.map((color) => (
              <Card key={color.name} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">{color.name}</CardTitle>
                  <CardDescription>var({color.cssVariable})</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="h-20 rounded flex items-center justify-center mb-2"
                    style={{ backgroundColor: color.value }}
                  >
                    <span className="text-white font-mono text-sm bg-black/30 px-2 py-1 rounded">
                      {color.value}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => copyToClipboard(color.value, color.name)}
                  >
                    {copiedItem === color.name ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    Copy Value
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

      {/* Spacing Tab */}
      <TabsContent value="spacing" className="space-y-4">
        <h2 className="text-2xl font-bold mb-4 text-on-dark">Spacing Scale</h2>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="space-y-2">
              {data.spacing.map((space) => (
                <div key={space.name} className="flex items-center gap-4">
                  <span className="w-16 font-mono text-sm text-on-dark">{space.name}</span>
                  <div
                    className="bg-primary"
                    style={{ width: space.pixels, height: "24px" }}
                  />
                  <span className="text-sm text-on-dark">{space.value}</span>
                  <span className="text-sm text-on-dark">({space.pixels})</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`p-${space.name}`, `spacing-${space.name}`)}
                  >
                    {copiedItem === `spacing-${space.name}` ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Glassmorphism Tab */}
      <TabsContent value="glassmorphism" className="space-y-6">
        <h2 className="text-2xl font-bold mb-4 text-on-dark">Glassmorphism Effects</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {data.glassmorphism.examples.map((example) => (
            <Card key={example.name} className="glass-card">
              <CardHeader>
                <CardTitle>{example.name}</CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`p-6 rounded-lg ${example.class}`}>
                  <p className={example.class === "gradient-text" ? "" : "text-on-dark"}>
                    Example of {example.name}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <code className="text-sm bg-black/20 px-2 py-1 rounded text-on-dark">{example.class}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(example.class, example.name)}
                  >
                    {copiedItem === example.name ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CSS Code Example */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Implementation Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-on-dark">{`.glass-card {
  --border-width: 1px;
  border-radius: 1rem;
  position: relative;
  background: hsl(from var(--surface-bg) h s l / 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Animations Tab */}
      <TabsContent value="animations" className="space-y-6">
        <h2 className="text-2xl font-bold mb-4 text-on-dark">Animations</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {data.animations.map((animation) => (
            <Card key={animation.name} className="glass-card">
              <CardHeader>
                <CardTitle>{animation.name}</CardTitle>
                <CardDescription>animation: {animation.value}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-32 flex items-center justify-center">
                  {animation.name === "float" ? (
                    <div className="w-20 h-20 bg-primary rounded-lg float-animation" />
                  ) : animation.name.includes("accordion") ? (
                    <div className="text-center">
                      <p className="text-sm text-on-dark">
                        Used for accordion components
                      </p>
                    </div>
                  ) : (
                    <div className={`w-20 h-20 bg-primary rounded-lg animate-${animation.name}`} />
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <code className="text-sm">animate-{animation.name}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`animate-${animation.name}`, animation.name)}
                  >
                    {copiedItem === animation.name ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}