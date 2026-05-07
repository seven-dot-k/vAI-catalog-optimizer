import { Suspense } from "react";
import Link from "next/link";
import { StorefrontChat } from "@/components/chat/storefront-chat";

export default function ProductLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-full min-h-screen flex-col">
      <nav className="flex gap-4 px-4 py-3 border-b border-border">
        <Link href="/product/ELEC-001" className="text-sm hover:underline">Wireless Headphones Pro</Link>
        <Link href="/product/ELEC-002" className="text-sm hover:underline">USB-C Hub 7-in-1</Link>
        <Link href="/product/ELEC-003" className="text-sm hover:underline">Smart Watch Series X</Link>
      </nav>
      <div className="flex flex-1">
        <main className="w-3/4 overflow-y-auto">
          {children}
        </main>
        <aside className="w-1/4 border-l border-border">
          <Suspense fallback={null}>
            <StorefrontChat />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
