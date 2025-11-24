import { Menu, X } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ title, subtitle, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? (
                <Menu className="w-6 h-6 text-slate-600" />
              ) : (
                <X className="w-6 h-6 text-slate-600" />
              )}
            </button>

            <div className="animate-fade-in-up">
              <h1 className="header">{title}</h1>
              {subtitle && <p className="subtitle">{subtitle}</p>}
            </div>
          </div>

          {/* Optional: Add user menu or actions here */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-slate-900">POLATI</p>
              <p className="text-xs text-slate-500">Система планирования ИТР</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
