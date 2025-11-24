import { Calculator, BarChart3, Building2, FileText, TrendingUp, Users } from 'lucide-react';
import type { PageRoute } from '../../types';

interface SidebarProps {
  currentPage: PageRoute;
  onPageChange: (page: PageRoute) => void;
}

const navigationItems = [
  { id: 'calculator' as PageRoute, label: 'Калькулятор', icon: Calculator },
  { id: 'analytics' as PageRoute, label: 'Аналитика проектов', icon: BarChart3 },
  { id: 'projects' as PageRoute, label: 'Динамика по проектам', icon: TrendingUp },
  { id: 'labor' as PageRoute, label: 'Соотношение ИТР', icon: Users },
  { id: 'standards' as PageRoute, label: 'Нормативы компании', icon: FileText },
];

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  return (
    <div className="sidebar">
      {/* Logo Section */}
      <div className="text-center py-8 px-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl shadow-lg flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold mb-1">ITR Калькулятор</h2>
        <p className="text-xs text-slate-400">ПОЛАТИ v2.0</p>
      </div>

      {/* Navigation */}
      <nav className="px-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`sidebar-link w-full ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Info Card */}
      <div className="absolute bottom-8 left-4 right-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
        <p className="text-xs text-slate-300 mb-2">
          Расчет численности ИТР на основе <span className="font-semibold">74 проектов</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <p className="text-xs text-slate-400">Данные: Январь-Октябрь 2025</p>
        </div>
      </div>
    </div>
  );
}
