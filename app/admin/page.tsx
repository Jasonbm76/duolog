import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Palette, Component, Book, Search, Code2 } from "lucide-react";

export default function AdminPage() {
  const features = [
    {
      title: "Documentation Viewer",
      description: "Browse and search all markdown documentation files from the /docs folder",
      href: "/admin/docs",
      icon: FileText,
      status: "Active",
    },
    {
      title: "Style Guide",
      description: "Interactive style guide auto-generated from your Tailwind configuration",
      href: "/admin/style-guide",
      icon: Palette,
      status: "Active",
    },
    {
      title: "Component Library",
      description: "Browse all components with live examples and auto-generated documentation",
      href: "/admin/components",
      icon: Component,
      status: "Active",
    },
    {
      title: "Playground",
      description: "Interactive component playground to test and experiment with components",
      href: "/admin/playground",
      icon: Book,
      status: "Active",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">
          Duolog Documentation System
        </h1>
        <p className="text-on-dark text-lg">
          Living documentation that stays in sync with your codebase
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="glass-card hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="w-8 h-8 text-primary" />
                    <span className="text-xs px-2 py-1 rounded-full bg-success/20 text-success">
                      {feature.status}
                    </span>
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="glass-card mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="w-5 h-5" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-on-dark">Features</h3>
            <ul className="space-y-2 text-on-dark">
              <li className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Full-text search across all documentation
              </li>
              <li className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                Copy-to-clipboard for all code examples
              </li>
              <li className="flex items-center gap-2">
                <Component className="w-4 h-4" />
                Auto-generated component documentation from TypeScript
              </li>
              <li className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Live style guide from Tailwind configuration
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-on-dark">Educational Content</h3>
            <p className="text-on-dark">
              This documentation system is designed to be educational and will be featured
              on SoloBuild.dev as an example of building in public with modern tools.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}