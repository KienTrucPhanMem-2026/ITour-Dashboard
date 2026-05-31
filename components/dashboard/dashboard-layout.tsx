'use client';

import { Sidebar } from './sidebar';
import { Navbar } from './navbar';

export function DashboardLayout({
  children,
  isFullWidth = false,
  focusMode = false,
}: {
  children: React.ReactNode;
  isFullWidth?: boolean;
  focusMode?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white">
      {!focusMode && <Sidebar />}
      <div className={focusMode ? "" : "lg:ml-64"}>
        {!focusMode && <Navbar />}
        <main className={focusMode ? "p-0" : "p-4 lg:p-8"}>
          <div className={isFullWidth || focusMode ? "w-full" : "max-w-7xl mx-auto"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

