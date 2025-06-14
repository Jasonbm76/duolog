import Link from "next/link";
import Image from "next/image";
import { FileText, Palette, Component, Home, Book, Mail } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/admin", label: "Overview", icon: Home },
    { href: "/admin/components", label: "Components", icon: Component },
    { href: "/admin/docs", label: "Documentation", icon: FileText },
    { href: "/admin/email-preview", label: "Email Preview", icon: Mail },
    { href: "/admin/playground", label: "Playground", icon: Book },
    { href: "/admin/style-guide", label: "Style Guide", icon: Palette },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Navigation */}
      <div className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.svg"
                alt="DuoLog.ai"
                width={120}
                height={32}
                style={{ height: '32px', width: '120px' }}
              />
              <span className="text-on-dark-muted text-sm font-medium">
                Admin
              </span>
            </Link>
            
            {/* Navigation */}
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}