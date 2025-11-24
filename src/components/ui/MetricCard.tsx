import type { MetricCardProps } from '../../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ label, value, icon, color = '#4f46e5', trend }: MetricCardProps) {
  return (
    <div
      className="metric-card animate-fade-in-up"
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        {icon && <div className="text-white/90">{icon}</div>}
        {trend && (
          <div className="flex items-center gap-1 text-white/90 text-sm">
            {trend.isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-extrabold text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
      </div>
      <div className="text-sm font-medium text-white/90">{label}</div>
    </div>
  );
}
