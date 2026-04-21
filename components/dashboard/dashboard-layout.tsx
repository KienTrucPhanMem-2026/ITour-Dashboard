'use client';

import { Sidebar } from './sidebar';
import { Navbar } from './navbar';

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100">
      <Sidebar />
      <div className="lg:ml-64">
        <Navbar />
        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
