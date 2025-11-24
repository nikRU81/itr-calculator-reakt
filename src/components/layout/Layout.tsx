import type { ReactNode } from 'react';
import TopNav from './TopNav';
import type { PageRoute } from '../../types';

interface LayoutProps {
  children: ReactNode;
  currentPage: PageRoute;
  onPageChange: (page: PageRoute) => void;
  title: string;
  subtitle?: string;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function Layout({
  children,
  currentPage,
  onPageChange,
  title,
  subtitle,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <TopNav currentPage={currentPage} onPageChange={onPageChange} />

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Main content */}
      <main className="py-4 px-4">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-500">
            <p>© 2025 ПОЛАТИ. ITR Calculator v2.0</p>
            <p>Данные: 74 проекта • Январь-Октябрь 2025</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
