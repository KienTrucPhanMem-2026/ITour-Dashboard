'use client';

import { Sidebar } from './sidebar';
import { Navbar } from './navbar';

export function DashboardLayout({
  children,
  isFullWidth = false,
}: {
  children: React.ReactNode;
  isFullWidth?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="lg:ml-64">
        <Navbar />
        <main className="p-4 lg:p-8">
          <div className={isFullWidth ? "w-full" : "max-w-7xl mx-auto"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

