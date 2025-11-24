import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import type { PageRoute } from '../../types';

interface LayoutProps {
  children: ReactNode;
  currentPage: PageRoute;
  onPageChange: (page: PageRoute) => void;
  title: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Layout({
  children,
  currentPage,
  onPageChange,
  title,
  subtitle,
  sidebarCollapsed,
  onToggleSidebar,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ${
          sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
        }`}
      >
        <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      </div>

      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleSidebar}
        />
      )}

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen">
        <Header
          title={title}
          subtitle={subtitle}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
        />

        <main className="p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white mt-12">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-slate-600">
              <p>© 2025 ПОЛАТИ. ITR Calculator v2.0</p>
              <p>Данные: 74 проекта • Январь-Октябрь 2025</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
