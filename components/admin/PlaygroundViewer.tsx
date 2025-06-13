"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Play, RefreshCw } from "lucide-react";

export default function PlaygroundViewer() {
  const [selectedComponent, setSelectedComponent] = useState("Button");
  const [componentProps, setComponentProps] = useState<Record<string, any>>({
    variant: "default",
    size: "default",
    disabled: false,
    children: "Click me"
  });
  const [copiedCode, setCopiedCode] = useState(false);

  const components = {
    Button: {
      props: {
        variant: { type: "select", options: ["default", "error", "outline", "secondary", "ghost", "link"], default: "default" },
        size: { type: "select", options: ["default", "sm", "lg", "icon"], default: "default" },
        disabled: { type: "boolean", default: false },
        children: { type: "text", default: "Click me" }
      }
    },
    Card: {
      props: {
        className: { type: "text", default: "glass-card" },
        children: { type: "text", default: "Card content goes here" }
      }
    },
    Badge: {
      props: {
        variant: { type: "select", options: ["default", "secondary", "error", "success", "warning", "care", "trust", "outline"], default: "default" },
        children: { type: "text", default: "Badge" }
      }
    },
    Input: {
      props: {
        type: { type: "select", options: ["text", "email", "password", "number"], default: "text" },
        placeholder: { type: "text", default: "Enter text..." },
        disabled: { type: "boolean", default: false }
      }
    }
  };

  const generateCode = () => {
    const props = Object.entries(componentProps)
      .filter(([key, value]) => {
        const componentConfig = components[selectedComponent as keyof typeof components] as any;
        const defaultValue = componentConfig?.props?.[key]?.default;
        return value !== defaultValue && value !== "";
      })
      .map(([key, value]) => {
        if (typeof value === "boolean") {
          return value ? key : "";
        }
        if (typeof value === "string") {
          return key === "children" ? "" : `${key}="${value}"`;
        }
        return `${key}={${JSON.stringify(value)}}`;
      })
      .filter(Boolean)
      .join(" ");

    const childrenValue = componentProps.children || "";
    
    if (selectedComponent === "Input") {
      return `<${selectedComponent}${props ? ` ${props}` : ""} />`;
    }
    
    return `<${selectedComponent}${props ? ` ${props}` : ""}>${childrenValue}</${selectedComponent}>`;
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generateCode());
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const resetProps = () => {
    const defaultProps = Object.entries(components[selectedComponent as keyof typeof components]?.props || {})
      .reduce((acc, [key, config]) => {
        acc[key] = config.default;
        return acc;
      }, {} as Record<string, any>);
    setComponentProps(defaultProps);
  };

  const renderComponent = () => {
    switch (selectedComponent) {
      case "Button":
        return (
          <Button
            variant={componentProps.variant as any}
            size={componentProps.size as any}
            disabled={componentProps.disabled}
          >
            {componentProps.children}
          </Button>
        );
      case "Card":
        return (
          <Card className={componentProps.className}>
            <CardContent className="pt-6">
              {componentProps.children}
            </CardContent>
          </Card>
        );
      case "Badge":
        return (
          <Badge variant={componentProps.variant as any}>
            {componentProps.children}
          </Badge>
        );
      case "Input":
        return (
          <Input
            type={componentProps.type}
            placeholder={componentProps.placeholder}
            disabled={componentProps.disabled}
          />
        );
      default:
        return <div>Component not found</div>;
    }
  };

  const renderPropControl = (propName: string, propConfig: any) => {
    const value = componentProps[propName];

    switch (propConfig.type) {
      case "select":
        return (
          <Select
            value={value}
            onValueChange={(newValue) =>
              setComponentProps(prev => ({ ...prev, [propName]: newValue }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {propConfig.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "text":
        return propName === "children" && value && value.length > 50 ? (
          <Textarea
            value={value}
            onChange={(e) =>
              setComponentProps(prev => ({ ...prev, [propName]: e.target.value }))
            }
            rows={3}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) =>
              setComponentProps(prev => ({ ...prev, [propName]: e.target.value }))
            }
          />
        );
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) =>
              setComponentProps(prev => ({ ...prev, [propName]: e.target.value }))
            }
          />
        );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Component Selection */}
      <div className="lg:col-span-1">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Select Component</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(components).map((component) => (
              <button
                key={component}
                onClick={() => {
                  setSelectedComponent(component);
                  const defaultProps = Object.entries(components[component as keyof typeof components]?.props || {})
                    .reduce((acc, [key, config]) => {
                      acc[key] = config.default;
                      return acc;
                    }, {} as Record<string, any>);
                  setComponentProps(defaultProps);
                }}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedComponent === component
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-white/10 text-on-dark-muted'
                }`}
              >
                {component}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Props Controls */}
        <Card className="glass-card mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Props</CardTitle>
              <Button size="sm" variant="ghost" onClick={resetProps}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(components[selectedComponent as keyof typeof components]?.props || {}).map(([propName, propConfig]) => (
              <div key={propName} className={`${propConfig.type === 'boolean' ? 'flex items-center justify-between' : 'space-y-2'}`}>
                <Label className="text-sm font-medium capitalize text-on-dark-muted">
                  {propName}
                </Label>
                {propConfig.type === 'boolean' ? (
                  <Switch
                    checked={componentProps[propName]}
                    onCheckedChange={(checked) =>
                      setComponentProps(prev => ({ ...prev, [propName]: checked }))
                    }
                  />
                ) : (
                  renderPropControl(propName, propConfig)
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Preview and Code */}
      <div className="lg:col-span-2">
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your component looks with the current props
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-32 flex items-center justify-center p-8 border border-white/10 rounded-lg bg-black/20">
                  {renderComponent()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Generated Code</CardTitle>
                    <CardDescription>Copy and paste this code into your project</CardDescription>
                  </div>
                  <Button onClick={copyCode} variant="ghost">
                    {copiedCode ? <Copy className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-sm overflow-x-auto">
                  <code className="text-on-dark-muted">{generateCode()}</code>
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Examples */}
        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle>Quick Examples</CardTitle>
            <CardDescription>Common usage patterns for {selectedComponent}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedComponent === "Button" && (
                <>
                  <div className="flex gap-2">
                    <Button size="sm">Primary</Button>
                    <Button variant="secondary" size="sm">Secondary</Button>
                    <Button variant="outline" size="sm">Outline</Button>
                    <Button variant="ghost" size="sm">Ghost</Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm">Small</Button>
                    <Button>Default</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </>
              )}
              {selectedComponent === "Badge" && (
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="care">Care</Badge>
                    <Badge variant="trust">Trust</Badge>
                  </div>
                </div>
              )}
              {selectedComponent === "Card" && (
                <div className="space-y-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle>Example Card</CardTitle>
                      <CardDescription>This is a description</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-on-dark-muted">Card content goes here</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}